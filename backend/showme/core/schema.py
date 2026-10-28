from typing import Any, Literal

from pydantic import BaseModel

Status = Literal["ok", "unsure", "not_visible", "done", "refuse"]
Action = Literal["tap", "type", "scroll", "none"]
ScrollDirection = Literal["none", "up", "down", "left", "right"]

# ARCHITECTURE §5.3 strict schema: every object additionalProperties:false, every property required.
GROUNDING_SCHEMA: dict[str, Any] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "status",
        "action",
        "instruction",
        "target_label",
        "point",
        "bbox",
        "scroll_direction",
        "type_text",
        "confidence",
        "caution",
        "reason",
    ],
    "properties": {
        "status": {"type": "string", "enum": ["ok", "unsure", "not_visible", "done", "refuse"]},
        "action": {"type": "string", "enum": ["tap", "type", "scroll", "none"]},
        "instruction": {"type": "string"},
        "target_label": {"type": "string"},
        "point": {
            "type": "object",
            "additionalProperties": False,
            "required": ["x", "y"],
            "properties": {"x": {"type": "integer"}, "y": {"type": "integer"}},
        },
        "bbox": {
            "type": "object",
            "additionalProperties": False,
            "required": ["x_min", "y_min", "x_max", "y_max"],
            "properties": {
                "x_min": {"type": "integer"},
                "y_min": {"type": "integer"},
                "x_max": {"type": "integer"},
                "y_max": {"type": "integer"},
            },
        },
        "scroll_direction": {"type": "string", "enum": ["none", "up", "down", "left", "right"]},
        "type_text": {"type": "string"},
        "confidence": {"type": "number"},
        "caution": {"type": "string"},
        "reason": {"type": "string"},
    },
}


class Point(BaseModel):
    x: int
    y: int


class BBox(BaseModel):
    x_min: int
    y_min: int
    x_max: int
    y_max: int


class ModelOutput(BaseModel):
    status: Status
    action: Action
    instruction: str
    target_label: str
    point: Point
    bbox: BBox
    scroll_direction: ScrollDirection
    type_text: str
    confidence: float
    caution: str
    reason: str


class PointPx(BaseModel):
    x: int
    y: int


class BoxPx(BaseModel):
    x1: int
    y1: int
    x2: int
    y2: int


class Target(BaseModel):
    label: str
    point: PointPx
    box: BoxPx


class StepResult(BaseModel):
    status: Status
    action: Action
    instruction: str
    target: Target | None
    scroll_direction: ScrollDirection
    type_text: str
    caution: str
    confidence: float
    goal_complete: bool
    point_fixed: bool = False


class Refinement(BaseModel):
    mode: Literal["outline", "box"]
    svg_path: str | None = None
    origin: PointPx | None = None
    box: BoxPx | None = None
    latency_ms: int = 0
    cost_usd: float = 0.0025
