import re

from showme.core.pii import contains_pii
from showme.core.schema import BoxPx, ModelOutput, PointPx, StepResult, Target

_MARKDOWN = re.compile(r"[*_`#>]|\[(.*?)\]\(.*?\)")


def _clean(text: str) -> str:
    return _MARKDOWN.sub(r"\1", text).strip()[:200]


def _clamp(v: int) -> int:
    return min(max(v, 0), 1000)  # model can return 1001 (API-3)


def postprocess(raw: ModelOutput, width: int, height: int, tau: float) -> StepResult:
    """ARCH §5.4 steps 0-7. Pure function."""
    instruction = _clean(raw.instruction)
    confidence = min(max(raw.confidence, 0.0), 1.0)  # model returned >1.0 on Day 3 held-out
    type_text = "" if contains_pii(raw.type_text) else raw.type_text
    if raw.status not in ("ok", "unsure"):
        return StepResult(
            status=raw.status,
            action=raw.action,
            instruction=instruction,
            target=None,
            scroll_direction=raw.scroll_direction,
            type_text=type_text,
            caution=raw.caution,
            confidence=confidence,
            goal_complete=raw.status == "done",
        )

    x1, x2 = sorted((_clamp(raw.bbox.x_min), _clamp(raw.bbox.x_max)))
    y1, y2 = sorted((_clamp(raw.bbox.y_min), _clamp(raw.bbox.y_max)))
    px, py = _clamp(raw.point.x), _clamp(raw.point.y)
    point_fixed = not (x1 <= px <= x2 and y1 <= py <= y2)
    if point_fixed:
        px, py = (x1 + x2) // 2, (y1 + y2) // 2

    box = BoxPx(x1=x1 * width // 1000, y1=y1 * height // 1000, x2=x2 * width // 1000, y2=y2 * height // 1000)
    area = (box.x2 - box.x1) * (box.y2 - box.y1)
    status = raw.status
    if status == "ok" and (area < 16 or area > 0.60 * width * height):
        status = "unsure"
    if status == "ok" and raw.confidence < tau:  # §5.4.5; verifier switch decided Day 3 (§5.5)
        status = "unsure"
    target = Target(label=raw.target_label, point=PointPx(x=px * width // 1000, y=py * height // 1000), box=box)
    return StepResult(
        status=status,
        action=raw.action,
        instruction=instruction,
        target=target,
        scroll_direction=raw.scroll_direction,
        type_text=type_text,
        caution=raw.caution,
        confidence=confidence,
        goal_complete=False,
        point_fixed=point_fixed,
    )
