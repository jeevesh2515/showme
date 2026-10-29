from dataclasses import dataclass


def validate_model_id(model: str) -> str:
    """PRIV-6: contributor-mode models grant Meta content rights; banned everywhere."""
    if "contributor" in model.lower():
        raise ValueError(f"contributor-mode model is forbidden: {model}")
    return model


@dataclass(frozen=True)
class Settings:
    api_key: str = ""
    base_url: str = "https://api.meta.ai/v1"
    model: str = "muse-spark-1.3"
    escalation_model: str = "muse-wonder-1.0"
    sam_model: str = "sam-3.1"
    effort: str = "minimal"
    tau: float = 0.5  # ARCH §5.5: weak gate until Day 3 calibration
    verifier_enabled: bool = False  # ARCH §5.5: Day 3 calibration decides
    ground_timeout_s: float = 15.0
    sam_timeout_s: float = 4.0
    backoff_base_s: float = 0.5

    def __post_init__(self) -> None:
        validate_model_id(self.model)
        validate_model_id(self.escalation_model)
        validate_model_id(self.sam_model)
        from urllib.parse import urlparse

        if urlparse(self.base_url).hostname != "api.meta.ai":
            raise ValueError(f"base_url must be the Meta API host, got: {self.base_url}")
