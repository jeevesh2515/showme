import base64
import binascii
import contextlib
import inspect
import io
import json
import logging
import os
import re
import secrets
import time
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from showme.api.guides import (
    CreateGuideRequest,
    CreateGuideResponse,
    GetGuideResponse,
    GuideRecord,
    GuideStepOut,
    InMemoryGuideStore,
    SupabaseGuideStore,
    hash_secret,
    new_delete_key,
    new_token,
    purge_expired,
)
from showme.api.ratelimit import (
    InMemoryCounterStore,
    InMemoryRateLimiter,
    InMemorySpendCap,
    SupabaseCounterStore,
    SupabaseRateLimiter,
    SupabaseSpendCap,
    hash_key,
)
from showme.api.schemas import (
    ApiError,
    HealthResponse,
    RefineRequest,
    RefineResponse,
    StepRequest,
    StepResponse,
)
from showme.api.settings import ApiSettings
from showme.core.grounding import ModelError, ModelTimeout, ground
from showme.core.pii import mask_pii
from showme.core.postprocess import postprocess
from showme.core.pricing import cost_ground, max_step_cost
from showme.core.sam import refine

log = logging.getLogger("showme.api")
# PRIV-3: uvicorn's access log prints client IP + full path/query. Kill it at app level too,
# so every launch path (make dev, Docker, direct uvicorn) is metadata-only.
logging.getLogger("uvicorn.access").disabled = True

_DATA_URL = re.compile(r"^data:image/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$")
MAX_IMAGE_BYTES = 3 * 1024 * 1024
MAX_SIDE_PX = 2560  # D20 cap; ARCH §4


def _image_size(image: str) -> tuple[int, int]:
    """ARCH §4 image validation; errors never echo image content (PRIV-3)."""
    match = _DATA_URL.match(image)
    if not match:
        raise ApiError(400, "invalid_image", "Image must be a JPEG, PNG or WebP data URL.")
    if len(match.group(1)) > 4 * MAX_IMAGE_BYTES // 3 + 4:  # reject before decoding (memory DoS guard)
        raise ApiError(413, "image_too_large", "Image must be 3 MB or smaller.")
    try:
        raw = base64.b64decode(match.group(1), validate=True)
    except (binascii.Error, ValueError):
        raise ApiError(400, "invalid_image", "Image data is not valid base64.") from None
    if len(raw) > MAX_IMAGE_BYTES:
        raise ApiError(413, "image_too_large", "Image must be 3 MB or smaller.")
    try:
        with Image.open(io.BytesIO(raw)) as im:
            width, height = im.size
            if max(width, height) > MAX_SIDE_PX:
                raise ApiError(400, "invalid_image", f"Image must be at most {MAX_SIDE_PX} px on its longest side.")
            im.load()
    except ApiError:
        raise
    except (UnidentifiedImageError, OSError, ValueError):
        raise ApiError(400, "invalid_image", "Image could not be read.") from None
    return width, height


def client_ip(request: Request) -> str:
    """Only Vercel's own forwarded-for header is trusted, and only on Vercel (ARCH §8). Client-sent
    x-real-ip / x-forwarded-for are never trusted (2026-10-31 security review S1)."""
    if os.environ.get("VERCEL"):
        vercel = request.headers.get("x-vercel-forwarded-for", "").split(",")[0].strip()
        if vercel:
            return vercel
    return request.client.host if request.client else "unknown"


async def _maybe_await(value: Any) -> Any:
    """In-memory limiters are sync, Supabase-backed ones async; routes await either."""
    if inspect.isawaitable(value):
        return await value
    return value


async def _enforce_rate_limit(request: Request) -> None:
    cfg: ApiSettings = request.app.state.settings
    limiter = request.app.state.rate
    key = hash_key(client_ip(request), cfg.ip_hash_salt_seed)
    for window_s, limit in ((3600, cfg.rate_per_hour), (86400, cfg.rate_per_day)):
        # Fixed window id so the Supabase counter bucket resets with the window, not last-hit + window.
        bucket = f"{window_s}:{int(time.time() // window_s)}:{key}"
        if not await _maybe_await(limiter.check(bucket, limit, window_s)):
            raise ApiError(
                429,
                "rate_limited",
                "Too many requests. Please wait a moment and try again.",
                retry_after_s=limiter.retry_after_s(bucket, window_s),
            )


RESERVE_REFINE_USD = 0.0025  # SAM cost per image (single call, fixed price)


def _record_meta(request: Request, model: str, tokens: int, cost_usd: float) -> None:
    request.state.log_meta = {"model": model, "tokens": tokens, "cost_usd": round(cost_usd, 6)}


def create_app(settings: ApiSettings | None = None) -> FastAPI:
    cfg = settings or ApiSettings()
    prod = os.environ.get("VERCEL_ENV") == "production"
    app = FastAPI(
        title="ShowMe API",
        version="0.1.0",
        docs_url=None if prod else "/docs",
        redoc_url=None,
        openapi_url=None if prod else "/openapi.json",
    )
    app.state.settings = cfg
    # API-6/PRIV-5: Supabase-backed stores when configured (ARCH §8/§9), in-memory otherwise.
    if cfg.supabase_url and cfg.supabase_service_role_key:
        counters = SupabaseCounterStore(cfg.supabase_url, cfg.supabase_service_role_key)
        app.state.rate = SupabaseRateLimiter(counters)
        app.state.spend = SupabaseSpendCap(counters)
        app.state.guide_store = SupabaseGuideStore(cfg.supabase_url, cfg.supabase_service_role_key)
    else:
        counters = InMemoryCounterStore()
        app.state.rate = InMemoryRateLimiter()
        app.state.spend = InMemorySpendCap()
        app.state.guide_store = InMemoryGuideStore()
    app.state.counters = counters

    @app.exception_handler(ApiError)
    async def _api_error_handler(request: Request, exc: ApiError) -> JSONResponse:
        headers = {"Retry-After": str(exc.retry_after_s)} if exc.retry_after_s is not None else None
        return JSONResponse(exc.body(), status_code=exc.status_code, headers=headers)

    @app.exception_handler(RequestValidationError)
    async def _validation_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        # ARCH §12 / PRIV-3: field names and codes only, never the submitted values.
        fields = [".".join(str(part) for part in err["loc"][1:]) or err["type"] for err in exc.errors()]
        return JSONResponse(
            status_code=422,
            content={"error": {"code": "validation", "message": "Request is invalid.", "fields": fields}},
        )

    @app.middleware("http")
    async def _log_metadata(request: Request, call_next: Any) -> Any:
        request_id = uuid.uuid4().hex[:12]
        request.state.request_id = request_id
        request.state.log_meta = {}
        started = time.perf_counter()
        response = await call_next(request)
        route = getattr(request.scope.get("route"), "path", request.url.path)
        if route.startswith("/v1/guides/"):
            route = "/v1/guides/{token}"  # PRIV-3: a live share token must never reach logs via unmatched paths
        meta: dict[str, Any] = request.state.log_meta
        log.info(
            json.dumps(
                {
                    "request_id": request_id,
                    "route": route,
                    "status": response.status_code,
                    "latency_ms": int((time.perf_counter() - started) * 1000),
                    "model": meta.get("model"),
                    "tokens": meta.get("tokens", 0),
                    "cost_usd": meta.get("cost_usd", 0.0),
                }
            )
        )
        response.headers["X-Request-ID"] = request_id
        if route.startswith("/v1/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    @app.get("/v1/healthz", response_model=HealthResponse)
    async def healthz() -> HealthResponse:
        return HealthResponse(status="ok")

    @app.post("/v1/step", response_model=StepResponse)
    async def step(req: StepRequest, request: Request) -> StepResponse:
        await _enforce_rate_limit(request)
        # Reserve the worst-case cost (max generations x bounded tokens) so the cap holds before spend, not after.
        reserve_usd = max_step_cost(cfg.to_core_settings(escalate=req.escalate).model)
        if not await _maybe_await(
            request.app.state.spend.reserve(reserve_usd, cfg.spend_cap_daily_usd, cfg.spend_cap_total_usd)
        ):
            raise ApiError(503, "spend_cap_reached", "ShowMe has reached its demo spending limit. Try again tomorrow.")

        reserved = reserve_usd
        actual_cost = 0.0
        try:
            width, height = _image_size(req.image)
            if req.image_meta.redaction is None or not req.image_meta.redaction.pipeline:
                raise ApiError(400, "invalid_image", "Image must come from the redaction pipeline.")
            if (req.image_meta.width, req.image_meta.height) != (width, height):
                raise ApiError(400, "invalid_image", "Image size does not match image_meta.")

            core_settings = cfg.to_core_settings(escalate=req.escalate)
            history = [
                {
                    **item.model_dump(),
                    "instruction": mask_pii(item.instruction),
                    "target_label": mask_pii(item.target_label),
                }
                for item in req.history
            ]

            def record_usage(usage: dict) -> float:
                pt, ct = int(usage.get("prompt_tokens", 0)), int(usage.get("completion_tokens", 0))
                cost = cost_ground(core_settings.model, pt, ct)
                _record_meta(request, core_settings.model, pt + ct, cost)
                return cost

            try:
                raw, usage, latency_ms = await ground(req.image, mask_pii(req.goal), history, core_settings)
            except ModelTimeout as e:
                actual_cost = record_usage(e.usage)  # generations before the timeout still cost money
                raise ApiError(504, "model_timeout", "The model took too long. Please try again.") from None
            except ModelError as e:
                actual_cost = record_usage(e.usage)
                raise ApiError(502, "model_error", "The model could not read this screen. Please try again.") from None

            result = postprocess(raw, width, height, core_settings.tau)
            actual_cost = record_usage(usage)
            return StepResponse(
                **result.model_dump(),
                step_id="st_" + secrets.token_hex(6),
                model=core_settings.model,
                timings_ms={"ground": latency_ms},
                cost_usd=round(actual_cost, 6),
            )
        finally:
            await _maybe_await(request.app.state.spend.reconcile(reserved, actual_cost))

    @app.post("/v1/refine", response_model=RefineResponse)
    async def refine_step(req: RefineRequest, request: Request) -> RefineResponse:
        # API-6 counts steps, not refinements: one user step = /v1/step + /v1/refine would otherwise
        # halve the 30/hour quota (measured in the 2026-10-31 E2E run). SAM cost stays gated by the spend reserve.
        if not await _maybe_await(
            request.app.state.spend.reserve(RESERVE_REFINE_USD, cfg.spend_cap_daily_usd, cfg.spend_cap_total_usd)
        ):
            raise ApiError(503, "spend_cap_reached", "ShowMe has reached its demo spending limit. Try again tomorrow.")

        reserved = RESERVE_REFINE_USD
        actual_cost = 0.0
        try:
            width, height = _image_size(req.image)
            if req.image_meta.redaction is None or not req.image_meta.redaction.pipeline:
                raise ApiError(400, "invalid_image", "Image must come from the redaction pipeline.")
            if (req.image_meta.width, req.image_meta.height) != (width, height):
                raise ApiError(400, "invalid_image", "Image size does not match image_meta.")

            core_settings = cfg.to_core_settings()
            refinement = await refine(req.image, req.box, req.point, core_settings)
            actual_cost = float(refinement.cost_usd)
            _record_meta(request, core_settings.sam_model, 0, actual_cost)
            return RefineResponse(
                mode=refinement.mode,
                svg_path=refinement.svg_path,
                origin=refinement.origin,
                box=refinement.box,
                timings_ms={"sam": refinement.latency_ms},
                cost_usd=round(actual_cost, 6),
            )
        finally:
            await _maybe_await(request.app.state.spend.reconcile(reserved, actual_cost))

    @app.post("/v1/guides", response_model=CreateGuideResponse)
    async def create_guide(req: CreateGuideRequest, request: Request) -> CreateGuideResponse:
        # PRIV-5: sharing is opt-in only; consent is self-attested by the official client (D16).
        if not req.consent:
            raise ApiError(
                400, "consent_required", "Sharing needs your consent. Tick the consent box to create a link."
            )
        # API-6: charge the 5/day guide quota before any image decode work (2026-10-31 review H5).
        now = datetime.now(UTC)
        key = hash_key(client_ip(request), cfg.ip_hash_salt_seed)
        count, _ = await request.app.state.counters.incr(
            f"guide:{key}:{now.date().isoformat()}", count=1, expires_at=now + timedelta(hours=48)
        )
        if count > cfg.rate_guides_per_day:
            raise ApiError(429, "rate_limited", "You have shared a lot today. Try again tomorrow.")
        decoded: list[tuple[bytes, str]] = []
        for step_in in req.steps:
            width, height = _image_size(step_in.image)
            if (step_in.width, step_in.height) != (width, height):
                raise ApiError(400, "invalid_image", "Image size does not match the step size.")
            mime = step_in.image[5:].split(";", 1)[0]
            decoded.append((base64.b64decode(step_in.image.split(",", 1)[1]), mime))
        token, delete_key = new_token(), new_delete_key()
        guide_id = str(uuid.uuid4())  # guides.id is a Postgres uuid
        expires_at = now + timedelta(days=cfg.guide_ttl_days)
        stored_steps: list[dict[str, Any]] = []
        uploaded: list[str] = []
        try:
            for step_in, (data, mime) in zip(req.steps, decoded, strict=True):
                ext = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}.get(mime, "jpg")
                path = f"{guide_id}/{step_in.n}.{ext}"
                await request.app.state.guide_store.put_image(path, data, mime)
                uploaded.append(path)
                stored_steps.append(
                    {
                        "n": step_in.n,
                        "instruction": mask_pii(step_in.instruction),
                        "target": step_in.target.model_dump() if step_in.target else None,
                        "svg_path": step_in.svg_path,
                        "svg_origin": step_in.svg_origin.model_dump() if step_in.svg_origin else None,
                        "width": step_in.width,
                        "height": step_in.height,
                        "image_path": path,
                    }
                )
            await request.app.state.guide_store.put(
                GuideRecord(
                    id=guide_id,
                    token_hash=hash_secret(token),
                    delete_key_hash=hash_secret(delete_key),
                    goal=mask_pii(req.goal),
                    steps=stored_steps,
                    created_at=now,
                    expires_at=expires_at,
                )
            )
        except Exception:
            # No row will reference these objects; delete them so a failed create leaves no orphans (review H4).
            for path in uploaded:
                with contextlib.suppress(Exception):
                    await request.app.state.guide_store.delete_image(path)
            raise
        base = (cfg.public_base_url or str(request.base_url)).rstrip("/")
        return CreateGuideResponse(url=f"{base}/g/{token}", delete_key=delete_key, expires_at=expires_at.isoformat())

    @app.get("/v1/guides/{token}", response_model=GetGuideResponse)
    async def get_guide(token: str, request: Request) -> GetGuideResponse:
        # No per-IP limit here: the caller is the /g page's server fetch (one shared egress IP for all
        # viewers), and the 128-bit token already defeats guessing (2026-10-31 review F1).
        now = datetime.now(UTC)
        record = await request.app.state.guide_store.get(hash_secret(token))
        # PRIV-5: unknown and expired are indistinguishable, so tokens cannot be probed.
        if record is None or record.expires_at <= now:
            raise ApiError(404, "guide_not_found", "This guide has gone.")
        steps = [
            GuideStepOut(
                n=int(s["n"]),
                instruction=str(s["instruction"]),
                image_url=await request.app.state.guide_store.signed_url(str(s["image_path"]), record.expires_at, now),
                target=s["target"],
                svg_path=s["svg_path"],
                svg_origin=s["svg_origin"],
                width=int(s["width"]),
                height=int(s["height"]),
            )
            for s in record.steps
        ]
        return GetGuideResponse(goal=record.goal, steps=steps, expires_at=record.expires_at.isoformat())

    @app.delete("/v1/guides/{token}")
    async def delete_guide(token: str, request: Request) -> dict[str, bool]:
        # No limiter: 128-bit token + 192-bit delete key make brute force hopeless, and a limiter
        # only lets link holders lock the creator out of deleting (2026-10-31 review N1).
        record = await request.app.state.guide_store.get(hash_secret(token))
        if record is None:
            raise ApiError(404, "guide_not_found", "This guide has gone.")
        provided = request.headers.get("x-delete-key", "")
        if not secrets.compare_digest(hash_secret(provided), record.delete_key_hash):
            raise ApiError(403, "invalid_delete_key", "That delete key does not match this guide.")
        # Images first, then the row: a storage failure leaves the guide intact and retryable (review F4).
        for s in record.steps:
            await request.app.state.guide_store.delete_image(str(s["image_path"]))
        await request.app.state.guide_store.delete(record.token_hash)
        return {"deleted": True}

    @app.get("/internal/purge")
    @app.post("/internal/purge")
    async def purge(request: Request) -> dict[str, int]:
        # API-9: Vercel Cron invokes with GET + Authorization: Bearer <CRON_SECRET>; manual calls use X-Cron-Secret.
        provided = (
            request.headers.get("x-cron-secret")
            or request.headers.get("authorization", "").removeprefix("Bearer ").strip()
        )
        # Bytes compare: compare_digest on str raises TypeError for non-ASCII headers (review L2).
        if not cfg.cron_secret or not secrets.compare_digest(provided.encode(), cfg.cron_secret.encode()):
            raise ApiError(401, "unauthorized", "Missing or wrong cron secret.")
        now = datetime.now(UTC)
        purged = await purge_expired(request.app.state.guide_store, now)
        counters_purged = int(await request.app.state.counters.purge_expired(now))
        return {"purged_guides": purged, "purged_counters": counters_purged}

    return app


app = create_app()
