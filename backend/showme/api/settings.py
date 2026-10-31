import os

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from showme.core.settings import Settings as CoreSettings
from showme.core.settings import validate_model_id


class ApiSettings(BaseSettings):
    """ARCH §11 env names: field name uppercased. Secrets stay in env only (PRIV-11)."""

    model_config = SettingsConfigDict(case_sensitive=False, extra="ignore")

    model_api_key: str = ""
    meta_base_url: str = "https://api.meta.ai/v1"
    grounding_model: str = "muse-spark-1.3"
    escalation_model: str = "muse-wonder-1.0"
    reasoning_effort: str = "minimal"
    spend_cap_daily_usd: float = 5.0
    spend_cap_total_usd: float = 60.0
    ip_hash_salt_seed: str = ""
    rate_per_hour: int = 30
    rate_per_day: int = 150
    # Day 5 (ARCH §8/§9): empty Supabase settings = in-memory stores (local dev/tests).
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    cron_secret: str = ""
    guide_ttl_days: float = 7.0
    rate_guides_per_day: int = 5
    public_base_url: str = ""  # web origin for share URLs; falls back to the API request host

    @model_validator(mode="after")
    def _prod_needs_salt(self) -> "ApiSettings":
        if os.environ.get("VERCEL_ENV") == "production":
            # Fail closed (2026-10-31 review L5/L6): no silent in-memory fallback or Host-built share URLs in prod.
            missing = [
                name
                for name in (
                    "ip_hash_salt_seed",
                    "supabase_url",
                    "supabase_service_role_key",
                    "cron_secret",
                    "public_base_url",
                )
                if not getattr(self, name)
            ]
            if missing:
                raise ValueError(f"production requires env: {', '.join(m.upper() for m in missing)}")
        return self

    @field_validator("grounding_model", "escalation_model")
    @classmethod
    def _standard_mode_only(cls, model: str) -> str:
        """PRIV-6: contributor-mode models are forbidden at every effort."""
        return validate_model_id(model)

    def to_core_settings(self, escalate: bool = False) -> CoreSettings:
        return CoreSettings(
            api_key=self.model_api_key,
            base_url=self.meta_base_url,
            model=self.escalation_model if escalate else self.grounding_model,
            escalation_model=self.escalation_model,
            effort=self.reasoning_effort,
        )
