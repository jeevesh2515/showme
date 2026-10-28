"""Run the production core over samples. Calls showme.core lazily so loaders/tests work without it."""

from __future__ import annotations

import base64
import hashlib
import io
from collections.abc import Sequence
from pathlib import Path
from typing import Any

from PIL import Image

from .cache import Cache, cache_key
from .datasets import Sample
from .metrics import point_in_box

MAX_SIDE = 2560  # D20: 2560 == native accuracy on dev-100; 1920 lost 8 points
JPEG_QUALITY = 85
TAU = 0.5  # production default until the Day 3 calibration run sets it (ARCHITECTURE §5.4)


def preprocess(
    image_path: Path, max_side: int = MAX_SIDE, quality: int = JPEG_QUALITY
) -> tuple[str, int, int]:
    """Same as production: RGB, long side <= max_side, JPEG q=85, data URL."""
    with Image.open(image_path) as im:
        im = im.convert("RGB")
        im.thumbnail((max_side, max_side), Image.LANCZOS)
        buffer = io.BytesIO()
        im.save(buffer, "JPEG", quality=quality)
        return (
            "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode(),
            im.width,
            im.height,
        )


def _get(obj: Any, name: str, default: Any = None) -> Any:
    if obj is None:
        return default
    if isinstance(obj, dict):
        return obj.get(name, default)
    return getattr(obj, name, default)


def _jsonable(obj: Any) -> Any:
    dump = getattr(obj, "model_dump", None)
    return dump() if callable(dump) else obj


def _rebuild_model_output(response: Any) -> Any:
    # Cache stores JSON; postprocess wants ModelOutput when that type exists.
    try:
        from showme.core.schema import ModelOutput

        return ModelOutput.model_validate(response)
    except Exception:  # noqa: BLE001 - cache JSON may not validate; fall back to raw dict
        return response


def _cost(usage: Any, model: str) -> float:
    from showme.core.pricing import cost_ground

    usage = usage or {}
    return cost_ground(
        model,
        int(usage.get("prompt_tokens", usage.get("input_tokens", 0))),
        int(usage.get("completion_tokens", usage.get("output_tokens", 0))),
    )


def _point_xy(target: Any) -> tuple[float, float] | None:
    point = _get(target, "point")
    if point is None:
        return None
    return (float(_get(point, "x")), float(_get(point, "y")))


def _box_xyxy(target: Any) -> list[float] | None:
    box = _get(target, "box", _get(target, "bbox"))
    if box is None:
        return None
    return [
        float(_get(box, "x1", _get(box, "x_min"))),
        float(_get(box, "y1", _get(box, "y_min"))),
        float(_get(box, "x2", _get(box, "x_max"))),
        float(_get(box, "y2", _get(box, "y_max"))),
    ]


async def run(
    samples: Sequence[Sample],
    settings: Any,
    sam_on: bool = False,
    split: str = "heldout",
    headline: bool = False,
    cache_dir: Path | None = None,
    max_side: int = MAX_SIDE,
) -> list[dict[str, Any]]:
    if split == "dev" and headline:
        raise ValueError("EVAL-9: a dev-split run cannot be headline")

    # shortcut: SAM refinement is not applied yet, so sam_on only selects a cache key; EVAL-4 lands with the SAM ablation.
    from showme.core import prompts
    from showme.core.grounding import ground
    from showme.core.postprocess import postprocess

    prompt_version = getattr(prompts, "PROMPT_VERSION", "unknown")
    tau = getattr(settings, "tau", TAU)
    cache = Cache(cache_dir) if cache_dir else None
    predictions: list[dict[str, Any]] = []

    for sample in samples:
        image_url, width, height = preprocess(sample.image_path, max_side=max_side)
        image_sha = hashlib.sha256(image_url.encode()).hexdigest()
        key = cache_key(
            settings.model,
            settings.effort,
            prompt_version,
            image_sha,
            sample.instruction,
            sam_on,
        )
        cached = cache.get(key) if cache else None
        from_cache = bool(cached)
        if cached:
            response = _rebuild_model_output(cached["response"])
            usage = cached.get("usage")
            latency_ms = cached["latency_ms"]
        else:
            try:
                response, usage, latency_ms = await ground(
                    image_url, sample.instruction, [], settings
                )
            except Exception as exc:  # noqa: BLE001 - one bad sample must not kill the run
                err_usage = getattr(exc, "usage", None) or {}
                predictions.append(
                    {
                        "sample_id": sample.id,
                        "instruction": sample.instruction,
                        "platform": sample.platform,
                        "element_type": sample.element_type,
                        "group": sample.group,
                        "status": "error",
                        "error": type(exc).__name__,
                        "confidence": None,
                        "point": None,
                        "box": None,
                        "gt_bbox": list(sample.bbox_xyxy_px),
                        "hit": False,
                        "latency_ms": 0,
                        "cost_usd": _cost(err_usage, settings.model),
                        "model": settings.model,
                        "effort": settings.effort,
                        "prompt_version": prompt_version,
                        "image_sha256": image_sha,
                        "response": None,
                    }
                )
                continue
            response_json = _jsonable(response)
            usage = _jsonable(usage)
            if cache:
                cache.put(
                    key,
                    {
                        "response": response_json,
                        "usage": usage,
                        "latency_ms": latency_ms,
                    },
                )

        result = postprocess(response, width, height, tau)
        target = _get(result, "target")
        point = _point_xy(target)
        # GT is in original px; prediction is in preprocessed px. Scale GT to compare.
        sx = width / sample.width if sample.width else 1.0
        sy = height / sample.height if sample.height else 1.0
        gt_scaled = (
            sample.bbox_xyxy_px[0] * sx,
            sample.bbox_xyxy_px[1] * sy,
            sample.bbox_xyxy_px[2] * sx,
            sample.bbox_xyxy_px[3] * sy,
        )
        hit = point is not None and point_in_box(point, gt_scaled)

        predictions.append(
            {
                "sample_id": sample.id,
                "instruction": sample.instruction,
                "platform": sample.platform,
                "element_type": sample.element_type,
                "group": sample.group,
                "status": _get(result, "status"),
                "confidence": _get(result, "confidence"),
                "point": list(point) if point else None,
                "box": _box_xyxy(target),
                "gt_bbox": list(sample.bbox_xyxy_px),
                "hit": hit,
                "latency_ms": latency_ms,
                "cost_usd": 0.0 if from_cache else _cost(usage, settings.model),
                "cached": from_cache,
                "model": settings.model,
                "effort": settings.effort,
                "prompt_version": prompt_version,
                "image_sha256": image_sha,
                "response": _jsonable(response),
            }
        )
    return predictions
