import base64
import io
import re
import time
from typing import Any

import httpx
from PIL import Image

from showme.core.pricing import cost_sam
from showme.core.schema import BoxPx, PointPx, Refinement
from showme.core.settings import Settings

BOX_RE = re.compile(r"<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=\d+;h=\d+(?:;c=[\d.]+)?\|>")
MASK_RE = re.compile(
    r"<\|mask;x=\d+;y=\d+(?:;c=[\d.]+)?;data=(\d+),(\d+),(!.+?)\|>", re.DOTALL
)  # payload may contain "|", ends at "|>"


def _image_size(image_data_url: str) -> tuple[int, int]:
    raw = base64.b64decode(image_data_url.split(",", 1)[1])
    with Image.open(io.BytesIO(raw)) as im:
        return im.size


def _iou(a: BoxPx, b: BoxPx) -> float:
    ix1, iy1 = max(a.x1, b.x1), max(a.y1, b.y1)
    ix2, iy2 = min(a.x2, b.x2), min(a.y2, b.y2)
    inter = max(0, ix2 - ix1) * max(0, iy2 - iy1)
    union = (a.x2 - a.x1) * (a.y2 - a.y1) + (b.x2 - b.x1) * (b.y2 - b.y1) - inter
    return inter / union if union else 0.0


def _box_result(latency_ms: int) -> Refinement:
    return Refinement(mode="box", latency_ms=latency_ms, cost_usd=cost_sam())


async def refine(image_data_url: str, box: BoxPx, point: PointPx, settings: Settings) -> Refinement:
    """ARCH §6: SAM box prompt + agreement gate. Any failure -> mode box; never moves point (API-4)."""
    t0 = time.perf_counter()
    try:
        from meta_sam_parser import (
            FramePrompt,
            PromptBox,
            PromptObject,
            SegmentationMask,
            build_object_prompt,
            decode_mask_to_svg_path,
        )

        width, height = _image_size(image_data_url)
        prompt = build_object_prompt(
            size=(width, height),
            objects=[
                PromptObject(
                    id=1, prompts=[FramePrompt(box=PromptBox(left=box.x1, top=box.y1, right=box.x2, bottom=box.y2))]
                )
            ],
        )
        payload: dict[str, Any] = {
            "model": settings.sam_model,
            "input": [
                {
                    "type": "message",
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": prompt},
                        {"type": "input_image", "image_url": image_data_url},
                    ],
                }
            ],
        }
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.base_url}/responses",
                json=payload,
                headers={"Authorization": f"Bearer {settings.api_key}"},
                timeout=settings.sam_timeout_s,
            )
        latency_ms = int((time.perf_counter() - t0) * 1000)
        if resp.status_code != 200:
            return _box_result(latency_ms)
        data = resp.json()
        text = data.get("output_text") or "".join(
            c.get("text", "") for o in data.get("output", []) for c in o.get("content", []) or []
        )
        bm, mm = BOX_RE.search(text), MASK_RE.search(text)
        if not bm or not mm:
            return _box_result(latency_ms)
        sam_box = BoxPx(x1=int(bm.group(1)), y1=int(bm.group(2)), x2=int(bm.group(3)), y2=int(bm.group(4)))
        contains = sam_box.x1 <= point.x <= sam_box.x2 and sam_box.y1 <= point.y <= sam_box.y2
        area_ok = (sam_box.x2 - sam_box.x1) * (sam_box.y2 - sam_box.y1) <= 0.25 * width * height
        if _iou(sam_box, box) < 0.5 or not contains or not area_ok:
            return _box_result(latency_ms)
        # Payload keeps its leading "!" one_bit marker (SPIKES c); data= is H,W so width is group 2.
        mask = SegmentationMask(
            encoding="one_bit", payload=mm.group(3), width=int(mm.group(2)), height=int(mm.group(1))
        )
        svg_path = decode_mask_to_svg_path(mask)
        return Refinement(
            mode="outline",
            svg_path=svg_path,
            origin=PointPx(x=sam_box.x1, y=sam_box.y1),
            box=sam_box,
            latency_ms=latency_ms,
            cost_usd=cost_sam(),
        )
    except Exception:  # noqa: BLE001 - ARCH §6: SAM failure never fails a step
        return _box_result(int((time.perf_counter() - t0) * 1000))
