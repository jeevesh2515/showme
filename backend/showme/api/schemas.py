from pydantic import BaseModel, Field

from showme.core.schema import Action, BoxPx, PointPx, ScrollDirection, Status, Target


class HistoryItem(BaseModel):
    n: int
    instruction: str = Field(max_length=200)
    action: str = Field(max_length=20)
    target_label: str = Field(max_length=100)
    result: str = Field(max_length=20)


class RedactionMeta(BaseModel):
    auto_regions: int
    manual_regions: int
    pipeline: str


class ImageMeta(BaseModel):
    width: int
    height: int
    redaction: RedactionMeta | None = None


class StepRequest(BaseModel):
    goal: str = Field(min_length=1, max_length=300)
    history: list[HistoryItem] = Field(default_factory=list, max_length=20)
    image: str
    image_meta: ImageMeta
    locale: str = "en-GB"
    escalate: bool = False


class RefineRequest(BaseModel):
    image: str
    image_meta: ImageMeta
    box: BoxPx
    point: PointPx


class StepResponse(BaseModel):
    step_id: str
    status: Status
    action: Action
    instruction: str
    target: Target | None
    scroll_direction: ScrollDirection
    type_text: str
    caution: str
    confidence: float
    goal_complete: bool
    model: str
    timings_ms: dict[str, int]
    cost_usd: float


class RefineResponse(BaseModel):
    mode: str
    svg_path: str | None = None
    origin: PointPx | None = None
    box: BoxPx | None = None
    timings_ms: dict[str, int]
    cost_usd: float


class HealthResponse(BaseModel):
    status: str


class ApiError(Exception):
    """Typed error body per ARCH §4: {error: {code, message, retry_after_s?}}."""

    def __init__(self, status_code: int, code: str, message: str, retry_after_s: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.retry_after_s = retry_after_s

    def body(self) -> dict[str, dict[str, object]]:
        error: dict[str, object] = {"code": self.code, "message": self.message}
        if self.retry_after_s is not None:
            error["retry_after_s"] = self.retry_after_s
        return {"error": error}
