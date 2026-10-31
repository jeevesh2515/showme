import asyncio
import base64
import io
import json
import logging

import httpx
import pytest
import respx
from fastapi.testclient import TestClient
from PIL import Image
from pydantic import ValidationError

from showme.api.main import create_app
from showme.api.settings import ApiSettings

STEP_URL = "https://api.meta.ai/v1/chat/completions"
SAM_URL = "https://api.meta.ai/v1/responses"

GOOD = {
    "status": "ok",
    "action": "tap",
    "instruction": "Tap Save.",
    "target_label": "Save",
    "point": {"x": 300, "y": 300},
    "bbox": {"x_min": 100, "y_min": 100, "x_max": 500, "y_max": 500},
    "scroll_direction": "none",
    "type_text": "",
    "confidence": 0.9,
    "caution": "",
    "reason": "r",
}


def png_data_url(width: int = 100, height: int = 100) -> str:
    buf = io.BytesIO()
    Image.new("RGB", (width, height), "white").save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def meta_reply(content: str | None = None, status: int = 200) -> httpx.Response:
    body = {
        "choices": [{"message": {"content": json.dumps(GOOD) if content is None else content}}],
        "usage": {"prompt_tokens": 1000, "completion_tokens": 100},
    }
    return httpx.Response(status, json=body)


def step_payload(**over: object) -> dict:
    payload = {
        "goal": "cancel my subscription",
        "history": [],
        "image": png_data_url(),
        "image_meta": {
            "width": 100,
            "height": 100,
            "redaction": {"auto_regions": 1, "manual_regions": 0, "pipeline": "v1"},
        },
    }
    payload.update(over)
    return payload


def refine_payload() -> dict:
    return {
        "image": png_data_url(),
        "image_meta": {
            "width": 100,
            "height": 100,
            "redaction": {"auto_regions": 0, "manual_regions": 0, "pipeline": "v1"},
        },
        "box": {"x1": 10, "y1": 10, "x2": 50, "y2": 50},
        "point": {"x": 30, "y": 30},
    }


def client(**over: object) -> TestClient:
    return TestClient(create_app(ApiSettings(model_api_key="test", **over)))


def test_api_1_healthz() -> None:
    resp = client().get("/v1/healthz")
    assert resp.status_code == 200 and resp.json() == {"status": "ok"}


@pytest.mark.parametrize("case", ["not_data_url", "size_mismatch", "missing_pipeline"])
def test_api_1_step_rejects_bad_image(case: str) -> None:
    payload = step_payload()
    if case == "not_data_url":
        payload["image"] = "https://example.com/screenshot.png"
    elif case == "size_mismatch":
        payload["image_meta"]["width"] = 200
    else:
        payload["image_meta"].pop("redaction")
    resp = client().post("/v1/step", json=payload)
    assert resp.status_code == 400 and resp.json()["error"]["code"] == "invalid_image"


def test_api_1_step_image_too_large() -> None:
    payload = step_payload(image="data:image/png;base64," + base64.b64encode(b"\0" * (3 * 1024 * 1024 + 1)).decode())
    resp = client().post("/v1/step", json=payload)
    assert resp.status_code == 413 and resp.json()["error"]["code"] == "image_too_large"


def test_api_1_goal_too_long_does_not_echo_goal() -> None:
    goal = "SECRETGOAL" + "x" * 400
    resp = client().post("/v1/step", json=step_payload(goal=goal))
    assert resp.status_code == 422
    body = resp.json()
    assert body["error"]["code"] == "validation" and "goal" in body["error"]["fields"]
    assert "SECRETGOAL" not in resp.text


@respx.mock
def test_api_1_step_happy_path() -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    resp = client().post("/v1/step", json=step_payload())
    assert resp.status_code == 200
    body = resp.json()
    assert body["step_id"].startswith("st_") and body["status"] == "ok"
    assert body["target"]["label"] == "Save"
    assert (body["target"]["point"]["x"], body["target"]["point"]["y"]) == (30, 30)
    assert (body["target"]["box"]["x1"], body["target"]["box"]["y2"]) == (10, 50)
    assert body["model"] == "muse-spark-1.3" and body["goal_complete"] is False


@respx.mock
def test_api_7_step_returns_timings_and_cost() -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    body = client().post("/v1/step", json=step_payload()).json()
    assert body["timings_ms"]["ground"] >= 0
    assert body["cost_usd"] == round((1000 * 1.25 + 100 * 4.25) / 1_000_000, 6)


@respx.mock
def test_api_7_refine_returns_timings_and_cost() -> None:
    respx.post(SAM_URL).mock(return_value=httpx.Response(500, json={}))
    body = client().post("/v1/refine", json=refine_payload()).json()
    assert body["timings_ms"]["sam"] >= 0 and body["cost_usd"] == 0.0025


@respx.mock
def test_api_1_step_escalate_uses_escalation_model() -> None:
    route = respx.post(STEP_URL).mock(return_value=meta_reply())
    body = client().post("/v1/step", json=step_payload(escalate=True)).json()
    assert body["model"] == "muse-wonder-1.0"
    assert json.loads(route.calls.last.request.content)["model"] == "muse-wonder-1.0"


@respx.mock
def test_api_2_step_model_error_502() -> None:
    route = respx.post(STEP_URL).mock(return_value=meta_reply(content="not json"))
    resp = client().post("/v1/step", json=step_payload())
    assert resp.status_code == 502 and resp.json()["error"]["code"] == "model_error"
    assert route.call_count == 2


@respx.mock
def test_api_4_refine_returns_box_on_sam_failure() -> None:
    respx.post(SAM_URL).mock(return_value=httpx.Response(500, json={}))
    resp = client().post("/v1/refine", json=refine_payload())
    assert resp.status_code == 200
    body = resp.json()
    assert body["mode"] == "box" and body["svg_path"] is None


@respx.mock
def test_api_6_rate_limit_429() -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    api = client(rate_per_hour=2, rate_per_day=100)
    statuses = [api.post("/v1/step", json=step_payload()).status_code for _ in range(3)]
    assert statuses == [200, 200, 429]
    body = api.post("/v1/step", json=step_payload()).json()
    assert body["error"]["code"] == "rate_limited" and body["error"]["retry_after_s"] > 0


@respx.mock
def test_api_6_refine_does_not_consume_step_quota() -> None:
    # One user step is /v1/step + /v1/refine; counting both halved the hourly step quota
    # (measured in eval/results/2026-10-31-e2e: 429 after ~15 steps).
    respx.post(STEP_URL).mock(return_value=meta_reply())
    respx.post(SAM_URL).mock(return_value=httpx.Response(500, json={}))
    api = client(rate_per_hour=1, rate_per_day=100)
    assert api.post("/v1/step", json=step_payload()).status_code == 200
    assert api.post("/v1/refine", json=refine_payload()).status_code == 200
    assert api.post("/v1/refine", json=refine_payload()).status_code == 200
    assert api.post("/v1/step", json=step_payload()).status_code == 429


@respx.mock
def test_api_6_spend_cap_503_before_model_call() -> None:
    route = respx.post(STEP_URL).mock(return_value=meta_reply())
    resp = client(spend_cap_daily_usd=0).post("/v1/step", json=step_payload())
    assert resp.status_code == 503 and resp.json()["error"]["code"] == "spend_cap_reached"
    assert route.call_count == 0


def test_priv_6_settings_reject_contributor() -> None:
    with pytest.raises(ValidationError):
        ApiSettings(grounding_model="muse-spark-1.3-contributor")
    with pytest.raises(ValidationError):
        ApiSettings(escalation_model="muse-wonder-1.0-contributor")


@respx.mock
def test_priv_3_logs_contain_no_goal_or_image(caplog: pytest.LogCaptureFixture) -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    payload = step_payload(goal="cancel my netflix subscription please")
    image_chunk = payload["image"][100:140]
    with caplog.at_level(logging.INFO, logger="showme.api"):
        assert client().post("/v1/step", json=payload).status_code == 200
    records = [r.getMessage() for r in caplog.records if r.name == "showme.api"]
    assert records and any(json.loads(r)["request_id"] for r in records)
    for line in records:
        assert "cancel my netflix subscription please" not in line
        assert image_chunk not in line
        assert "testclient" not in line


@respx.mock
def test_priv_7_goal_masked_before_model_call() -> None:
    route = respx.post(STEP_URL).mock(return_value=meta_reply())
    client().post("/v1/step", json=step_payload(goal="email leaky@example.com about the bill"))
    sent = json.loads(route.calls.last.request.content)
    text = sent["messages"][1]["content"][0]["text"]
    assert "leaky@example.com" not in text and "[hidden]" in text


@respx.mock
def test_api_1_step_model_timeout_504() -> None:
    respx.post(STEP_URL).mock(side_effect=httpx.ReadTimeout("slow"))
    resp = client().post("/v1/step", json=step_payload())
    assert resp.status_code == 504 and resp.json()["error"]["code"] == "model_timeout"


def test_api_1_refine_rejects_missing_redaction_pipeline() -> None:
    payload = refine_payload()
    payload["image_meta"].pop("redaction")
    resp = client().post("/v1/refine", json=payload)
    assert resp.status_code == 400 and resp.json()["error"]["code"] == "invalid_image"


def test_api_1_image_url_not_data_url_rejected() -> None:
    resp = client().post("/v1/step", json=step_payload(image="https://example.com/x.png?u=a@b.co"))
    assert resp.status_code == 400 and resp.json()["error"]["code"] == "invalid_image"


@respx.mock
def test_api_6_total_spend_cap_503() -> None:
    route = respx.post(STEP_URL).mock(return_value=meta_reply())
    resp = client(spend_cap_daily_usd=100.0, spend_cap_total_usd=0.0).post("/v1/step", json=step_payload())
    assert resp.status_code == 503 and resp.json()["error"]["code"] == "spend_cap_reached"
    assert not route.called


@respx.mock
def test_api_6_rate_limit_daily_429_and_retry_after_header() -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    api = client(rate_per_hour=100, rate_per_day=1)
    assert api.post("/v1/step", json=step_payload()).status_code == 200
    resp = api.post("/v1/step", json=step_payload())
    assert resp.status_code == 429 and int(resp.headers["Retry-After"]) > 0


@respx.mock
def test_priv_7_model_type_text_pii_emptied_in_response() -> None:
    bad = dict(GOOD, type_text="send it to a@b.co.uk")
    respx.post(STEP_URL).mock(return_value=meta_reply(content=json.dumps(bad)))
    body = client().post("/v1/step", json=step_payload()).json()
    assert body["type_text"] == ""


@respx.mock
def test_priv_3_ip_stored_as_salted_hash_not_raw() -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    api = client(ip_hash_salt_seed="test-salt")
    api.post("/v1/step", json=step_payload())
    keys = list(api.app.state.rate._hits)  # type: ignore[attr-defined]
    assert keys and all("testclient" not in k and len(k.split(":")[-1]) == 64 for k in keys)


def test_priv_3_launch_paths_disable_uvicorn_access_log() -> None:
    import logging
    import pathlib

    root = pathlib.Path(__file__).resolve().parents[2]
    assert "--no-access-log" in (root / "backend/Dockerfile").read_text()
    assert "--no-access-log" in (root / "Makefile").read_text()
    assert logging.getLogger("uvicorn.access").disabled


def test_priv_3_real_uvicorn_logs_no_client_ip_or_query() -> None:
    # Integration: boot the real server exactly as deployed, hit it with a sensitive query,
    # then read everything it printed. Access-log lines would contain both.
    import pathlib
    import socket
    import subprocess
    import sys
    import time
    import urllib.request

    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    proc = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "showme.api.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--no-access-log",
        ],
        cwd=pathlib.Path(__file__).resolve().parents[1],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env={"PATH": "/usr/bin:/bin:/usr/local/bin", "MODEL_API_KEY": "test"},
    )
    try:
        deadline = time.time() + 20
        while True:
            try:
                with urllib.request.urlopen(
                    f"http://127.0.0.1:{port}/v1/healthz?token=SENSITIVE_QUERY_VALUE", timeout=2
                ) as r:
                    assert r.status == 200
                break
            except Exception:
                if time.time() > deadline:
                    raise
                time.sleep(0.25)
    finally:
        proc.terminate()
        out, _ = proc.communicate(timeout=10)
    assert "SENSITIVE_QUERY_VALUE" not in out
    assert "/v1/healthz?" not in out


@respx.mock
def test_api_6_failed_generations_still_record_spend() -> None:
    # Review 2026-10-28 #3: two malformed generations cost 2 x 0.001675; counter must show it,
    # and a daily cap between one and two generations' cost must trip on the next call.
    respx.post(STEP_URL).mock(return_value=meta_reply(content="not json"))
    api = client(spend_cap_daily_usd=0.03, spend_cap_total_usd=60.0)
    resp = api.post("/v1/step", json=step_payload())
    assert resp.status_code == 502
    assert api.app.state.spend._day_total == pytest.approx(0.003350)  # type: ignore[attr-defined]
    resp2 = api.post("/v1/step", json=step_payload())
    assert resp2.status_code == 503 and resp2.json()["error"]["code"] == "spend_cap_reached"


@respx.mock
def test_api_2_retry_then_success_costs_both_generations() -> None:
    respx.post(STEP_URL).mock(side_effect=[meta_reply(content="not json"), meta_reply()])
    body = client().post("/v1/step", json=step_payload()).json()
    assert body["cost_usd"] == round(2 * (1000 * 1.25 + 100 * 4.25) / 1_000_000, 6)


@pytest.mark.anyio
@respx.mock
async def test_api_6_concurrent_requests_cannot_bypass_daily_spend_cap() -> None:
    # Review 2026-10-29 #2: 8 concurrent requests against a $0.002 daily cap.
    respx.post(STEP_URL).mock(return_value=meta_reply())
    app = create_app(ApiSettings(spend_cap_daily_usd=0.03, spend_cap_total_usd=60.0))
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        responses = await asyncio.gather(*(ac.post("/v1/step", json=step_payload()) for _ in range(8)))
    statuses = [r.status_code for r in responses]
    assert statuses.count(200) == 1
    assert statuses.count(503) == 7
    assert app.state.spend._day_total <= 0.03
    assert app.state.spend._reserved_day == 0.0


@pytest.mark.anyio
@respx.mock
async def test_api_6_concurrent_requests_cannot_bypass_total_spend_cap() -> None:
    respx.post(STEP_URL).mock(return_value=meta_reply())
    app = create_app(ApiSettings(spend_cap_daily_usd=10.0, spend_cap_total_usd=0.03))
    async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as ac:
        responses = await asyncio.gather(*(ac.post("/v1/step", json=step_payload()) for _ in range(8)))
    statuses = [r.status_code for r in responses]
    assert statuses.count(200) == 1
    assert statuses.count(503) == 7
    assert app.state.spend._total <= 0.03
    assert app.state.spend._reserved_total == 0.0


def _big_reply() -> httpx.Response:
    body = {
        "choices": [{"message": {"content": json.dumps(GOOD)}}],
        "usage": {"prompt_tokens": 10000, "completion_tokens": 100},
    }
    return httpx.Response(200, json=body)


@respx.mock
def test_api_6_reservation_blocks_when_max_cost_exceeds_cap() -> None:
    # Review 2026-10-30 #3: cap $0.002 must reject before the model call, not record $0.012925 after a 200.
    route = respx.post(STEP_URL).mock(return_value=_big_reply())
    api = client(spend_cap_daily_usd=0.002, spend_cap_total_usd=60.0)
    resp = api.post("/v1/step", json=step_payload())
    assert resp.status_code == 503 and resp.json()["error"]["code"] == "spend_cap_reached"
    assert route.call_count == 0
    assert api.app.state.spend._day_total == 0.0  # type: ignore[attr-defined]


@respx.mock
def test_api_6_large_usage_within_reserved_bounds_records_actual() -> None:
    respx.post(STEP_URL).mock(return_value=_big_reply())
    api = client(spend_cap_daily_usd=5.0, spend_cap_total_usd=60.0)
    resp = api.post("/v1/step", json=step_payload())
    assert resp.status_code == 200
    assert resp.json()["cost_usd"] == round((10000 * 1.25 + 100 * 4.25) / 1_000_000, 6)
    assert api.app.state.spend._day_total == pytest.approx(0.012925)  # type: ignore[attr-defined]
    assert api.app.state.spend._reserved_day == 0.0  # type: ignore[attr-defined]
