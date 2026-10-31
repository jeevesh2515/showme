"""PRIV-5 / API-6 / API-9 route tests for guides + purge. In-memory stores only; never network."""

import base64
import io

from fastapi.testclient import TestClient
from PIL import Image

from showme.api.main import create_app
from showme.api.settings import ApiSettings


def _img() -> str:
    buf = io.BytesIO()
    Image.new("RGB", (8, 8), (200, 30, 30)).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def _client(**kw: object) -> TestClient:
    return TestClient(create_app(ApiSettings(**kw)))  # type: ignore[arg-type]


def _create(client: TestClient, consent: bool = True) -> dict:  # type: ignore[type-arg]
    res = client.post(
        "/v1/guides",
        json={
            "goal": "cancel my subscription",
            "consent": consent,
            "steps": [
                {
                    "n": 1,
                    "instruction": "Tap Cancel",
                    "image": _img(),
                    "target": None,
                    "svg_path": None,
                    "svg_origin": None,
                    "width": 8,
                    "height": 8,
                }
            ],
        },
    )
    assert res.status_code == 200, res.text
    return res.json()  # type: ignore[no-any-return]


def test_priv_5_create_get_delete_guide_flow() -> None:
    client = _client(cron_secret="s3cret")
    created = _create(client)
    token = created["url"].rsplit("/", 1)[-1]
    assert token not in created["url"].split("/g/")[0]
    # Raw token/delete key never stored: store keys are hashes only.
    store = client.app.state.guide_store  # type: ignore[attr-defined]
    assert store._guides and token not in str(list(store._guides))
    got = client.get(f"/v1/guides/{token}")
    assert got.status_code == 200
    body = got.json()
    assert body["goal"] == "cancel my subscription"
    assert body["steps"][0]["image_url"].startswith("data:image/png")
    assert client.delete(f"/v1/guides/{token}", headers={"X-Delete-Key": "wrong"}).status_code == 403
    assert client.delete(f"/v1/guides/{token}", headers={"X-Delete-Key": created["delete_key"]}).status_code == 200
    assert client.get(f"/v1/guides/{token}").status_code == 404


def test_priv_5_create_requires_consent() -> None:
    client = _client()
    res = client.post(
        "/v1/guides",
        json={
            "goal": "x",
            "consent": False,
            "steps": [
                {
                    "n": 1,
                    "instruction": "Tap",
                    "image": _img(),
                    "target": None,
                    "svg_path": None,
                    "svg_origin": None,
                    "width": 8,
                    "height": 8,
                }
            ],
        },
    )
    assert res.status_code == 400
    assert res.json()["error"]["code"] == "consent_required"


def test_priv_5_expired_guide_404_same_as_unknown() -> None:
    client = _client(guide_ttl_days=-1)
    created = _create(client)
    token = created["url"].rsplit("/", 1)[-1]
    assert client.get(f"/v1/guides/{token}").status_code == 404
    assert client.get("/v1/guides/does-not-exist").status_code == 404


def test_api_6_guide_create_rate_limit() -> None:
    client = _client(rate_guides_per_day=1)
    _create(client)
    res = client.post(
        "/v1/guides",
        json={
            "goal": "x",
            "consent": True,
            "steps": [
                {
                    "n": 1,
                    "instruction": "Tap",
                    "image": _img(),
                    "target": None,
                    "svg_path": None,
                    "svg_origin": None,
                    "width": 8,
                    "height": 8,
                }
            ],
        },
    )
    assert res.status_code == 429
    assert res.json()["error"]["code"] == "rate_limited"


def test_priv_5_guide_get_is_not_ip_rate_limited() -> None:
    # The /g page fetches server-side from one shared egress IP; limiting GET would kill every
    # shared link after 30 views/hour and report live guides as gone (2026-10-31 review F1).
    client = _client()
    created = _create(client)
    token = created["url"].rsplit("/", 1)[-1]
    for _ in range(35):
        assert client.get(f"/v1/guides/{token}").status_code == 200


def test_api_9_purge_get_with_bearer_deletes_expired() -> None:
    # Vercel Cron invokes with GET + Authorization: Bearer (2026-10-31 review H1).
    client = _client(cron_secret="s3cret", guide_ttl_days=-1)
    _create(client)
    res = client.get("/internal/purge", headers={"Authorization": "Bearer s3cret"})
    assert res.status_code == 200
    assert res.json()["purged_guides"] == 1
    assert client.get("/internal/purge", headers={"Authorization": "Bearer wrong"}).status_code == 401


def test_api_6_guide_limit_charged_before_image_decode() -> None:
    client = _client(rate_guides_per_day=1)
    _create(client)
    res = client.post(
        "/v1/guides",
        json={
            "goal": "x",
            "consent": True,
            "steps": [
                {
                    "n": 1,
                    "instruction": "Tap",
                    "image": "not-an-image",
                    "target": None,
                    "svg_path": None,
                    "svg_origin": None,
                    "width": 8,
                    "height": 8,
                }
            ],
        },
    )
    assert res.status_code == 429  # quota hit, never reaches decode


def test_priv_5_failed_create_leaves_no_orphan_images() -> None:
    client = TestClient(create_app(ApiSettings()), raise_server_exceptions=False)
    store = client.app.state.guide_store  # type: ignore[attr-defined]

    async def _fail(record: object) -> None:
        raise RuntimeError("db down")

    store.put = _fail  # type: ignore[method-assign]
    res = client.post(
        "/v1/guides",
        json={
            "goal": "x",
            "consent": True,
            "steps": [
                {
                    "n": 1,
                    "instruction": "Tap",
                    "image": _img(),
                    "target": None,
                    "svg_path": None,
                    "svg_origin": None,
                    "width": 8,
                    "height": 8,
                }
            ],
        },
    )
    assert res.status_code == 500
    assert store._images == {}


def test_api_6_production_requires_supabase_settings(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    monkeypatch.setenv("VERCEL_ENV", "production")
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        ApiSettings(ip_hash_salt_seed="salt")


def test_api_9_purge_rejects_wrong_secret_and_deletes_nothing() -> None:
    client = _client(cron_secret="s3cret", guide_ttl_days=-1)
    created = _create(client)
    token = created["url"].rsplit("/", 1)[-1]
    assert client.post("/internal/purge").status_code == 401
    assert client.post("/internal/purge", headers={"X-Cron-Secret": "nope"}).status_code == 401
    # Expired record still present until an authorised purge (checked via purge count below).
    res = client.post("/internal/purge", headers={"X-Cron-Secret": "s3cret"})
    assert res.status_code == 200
    assert res.json()["purged_guides"] == 1
    assert client.get(f"/v1/guides/{token}").status_code == 404
