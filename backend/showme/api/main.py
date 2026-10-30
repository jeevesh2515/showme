import base64
import binascii
import io
import json
import logging
import os
import re
import secrets
import time
import uuid
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError

from showme.api.ratelimit import InMemoryRateLimiter, InMemorySpendCap, hash_key
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
    """Vercel-verified client IP only when running on Vercel. Raw X-Forwarded-For is never trusted (ARCH §8)."""
    if os.environ.get("VERCEL"):
        real = request.headers.get("x-real-ip")
        if real:
            return real.strip()
        vercel = request.headers.get("x-vercel-forwarded-for", "").split(",")[0].strip()
        if vercel:
            return vercel
    return request.client.host if request.client else "unknown"


def _enforce_rate_limit(request: Request) -> None:
    cfg: ApiSettings = request.app.state.settings
    limiter: InMemoryRateLimiter = request.app.state.rate
    key = hash_key(client_ip(request), cfg.ip_hash_salt_seed)
    for window_s, limit in ((3600, cfg.rate_per_hour), (86400, cfg.rate_per_day)):
        bucket = f"{window_s}:{key}"
        if not limiter.check(bucket, limit, window_s):
            raise ApiError(
                429,
                "rate_limited",
                "Too many requests. Please wait a moment and try again.",
                retry_after_s=limiter.retry_after_s(bucket, window_s),
            )


def _enforce_spend_cap(request: Request) -> None:
    cfg: ApiSettings = request.app.state.settings
    if not request.app.state.spend.check(cfg.spend_cap_daily_usd, cfg.spend_cap_total_usd):
        raise ApiError(503, "spend_cap_reached", "ShowMe has reached its demo spending limit. Try again tomorrow.")


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
    app.state.rate = InMemoryRateLimiter()
    app.state.spend = InMemorySpendCap()

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
        _enforce_rate_limit(request)
        # Reserve the worst-case cost (max generations x bounded tokens) so the cap holds before spend, not after.
        reserve_usd = max_step_cost(cfg.to_core_settings(escalate=req.escalate).model)
        if not request.app.state.spend.reserve(reserve_usd, cfg.spend_cap_daily_usd, cfg.spend_cap_total_usd):
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
            request.app.state.spend.reconcile(reserved, actual_cost)

    @app.post("/v1/refine", response_model=RefineResponse)
    async def refine_step(req: RefineRequest, request: Request) -> RefineResponse:
        _enforce_rate_limit(request)
        if not request.app.state.spend.reserve(RESERVE_REFINE_USD, cfg.spend_cap_daily_usd, cfg.spend_cap_total_usd):
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
            request.app.state.spend.reconcile(reserved, actual_cost)

    return app


app = create_app()
