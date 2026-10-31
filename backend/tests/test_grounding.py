import asyncio
import json

import httpx
import pytest
import respx

from showme.core.grounding import ModelError, ground
from showme.core.prompts import PROMPT_VERSION, SYSTEM_PROMPT
from showme.core.settings import Settings

GOOD = {
    "status": "ok",
    "action": "tap",
    "instruction": "Tap Save.",
    "target_label": "Save",
    "point": {"x": 1, "y": 2},
    "bbox": {"x_min": 0, "y_min": 0, "x_max": 10, "y_max": 10},
    "scroll_direction": "none",
    "type_text": "",
    "confidence": 0.9,
    "caution": "",
    "reason": "r",
}
SETTINGS = Settings(api_key="test", backoff_base_s=0.0)
URL = "https://api.meta.ai/v1/chat/completions"


def reply(content, status=200, usage=None, headers=None):
    body = {
        "choices": [{"message": {"content": content}}],
        "usage": usage or {"prompt_tokens": 10, "completion_tokens": 5},
    }
    return httpx.Response(status, json=body, headers=headers or {})


@respx.mock
def test_api_2_parses_strict_output():
    respx.post(URL).mock(return_value=reply(json.dumps(GOOD)))
    out, usage, latency = asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert out.target_label == "Save" and usage["prompt_tokens"] == 10 and latency >= 0


@respx.mock
def test_api_2_unparsable_retried_once_then_model_error():
    route = respx.post(URL).mock(return_value=reply("not json"))
    with pytest.raises(ModelError):
        asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert route.call_count == 2


@respx.mock
def test_api_5_429_backoff_honours_retry_after_then_succeeds():
    route = respx.post(URL).mock(side_effect=[reply("", 429, headers={"Retry-After": "0"}), reply(json.dumps(GOOD))])
    out, _, _ = asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert out.status == "ok" and route.call_count == 2


@respx.mock
def test_api_5_429_exhausts_three_tries():
    route = respx.post(URL).mock(return_value=reply("", 429, headers={"Retry-After": "0"}))
    with pytest.raises(ModelError):
        asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert route.call_count == 3


def test_priv_6_contributor_model_rejected():
    with pytest.raises(ValueError):
        Settings(model="muse-spark-1.3-contributor")


def test_recorded_grounding_fixture_validates():
    # Real muse-spark-1.3 response recorded by eval dev run 2026-10-28 (public benchmark, no PII/key).
    import json
    from pathlib import Path

    from showme.core.schema import ModelOutput

    fixture = json.loads((Path(__file__).parent / "fixtures/grounding_dev.json").read_text())
    out = ModelOutput.model_validate(fixture["response"])
    assert out.status in ("ok", "unsure", "not_visible", "done", "refuse")


def test_priv_10_prompt_never_asks_to_remove_blur():
    assert "Never ask the person to remove the blur" in SYSTEM_PROMPT
    assert PROMPT_VERSION == "v2"


@respx.mock
def test_api_2_schema_invalid_output_retried_once_then_model_error():
    bad = dict(GOOD, status="bogus")
    route = respx.post(URL).mock(return_value=reply(json.dumps(bad)))
    with pytest.raises(ModelError):
        asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert route.call_count == 2
    sent = json.loads(route.calls.last.request.content)
    assert sent["response_format"]["json_schema"]["strict"] is True


@respx.mock
def test_api_5_retry_after_seconds_is_slept(monkeypatch):
    sleeps = []

    async def fake_sleep(seconds):
        sleeps.append(seconds)

    monkeypatch.setattr("showme.core.grounding.asyncio.sleep", fake_sleep)
    respx.post(URL).mock(side_effect=[reply("", 429, headers={"Retry-After": "2"}), reply(json.dumps(GOOD))])
    out, _, _ = asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert out.status == "ok" and 2.0 in sleeps


@respx.mock
def test_api_2_retry_usage_accumulates_across_generations():
    # Review 2026-10-28 #3: malformed -> valid must report BOTH generations' usage.
    r1 = reply("not json", usage={"prompt_tokens": 1000, "completion_tokens": 100})
    r2 = reply(json.dumps(GOOD), usage={"prompt_tokens": 1000, "completion_tokens": 100})
    respx.post(URL).mock(side_effect=[r1, r2])
    _, usage, _ = asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert usage["prompt_tokens"] == 2000 and usage["completion_tokens"] == 200


@respx.mock
def test_api_2_failed_generations_usage_preserved_on_error():
    r = reply("not json", usage={"prompt_tokens": 1000, "completion_tokens": 100})
    respx.post(URL).mock(return_value=r)
    with pytest.raises(ModelError) as excinfo:
        asyncio.run(ground("data:image/jpeg;base64,x", "goal", [], SETTINGS))
    assert excinfo.value.usage["prompt_tokens"] == 2000  # two malformed generations
