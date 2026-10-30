import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from showme.api.main import create_app
from showme.api.settings import ApiSettings


def test_api_7_v1_responses_are_no_store() -> None:
    client = TestClient(create_app(ApiSettings(model_api_key="x")), raise_server_exceptions=False)
    res = client.get("/v1/healthz")
    assert res.headers.get("cache-control") == "no-store"


def test_priv_8_prod_docs_disabled(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("VERCEL_ENV", "production")
    monkeypatch.setenv("IP_HASH_SALT_SEED", "salt")
    app = create_app(ApiSettings(model_api_key="x", ip_hash_salt_seed="salt"))
    assert app.docs_url is None and app.openapi_url is None


def test_priv_3_prod_requires_salt(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("VERCEL_ENV", "production")
    with pytest.raises(ValidationError):
        ApiSettings(ip_hash_salt_seed="")
