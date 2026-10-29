"""ARCH 5.5 verifier pass: crop re-check, behind Settings.verifier_enabled (EVAL-6)."""

import asyncio
import base64
import io
import json

import httpx
import respx
from PIL import Image

from showme.core.settings import Settings
from showme.core.verifier import crop_for_verify, verify

URL = "https://api.meta.ai/v1/chat/completions"
SETTINGS = Settings(api_key="test", backoff_base_s=0.0)


def _data_url(size=(800, 600)) -> str:
    buf = io.BytesIO()
    Image.new("RGB", size, "white").save(buf, "JPEG")
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


def _reply(is_target: bool) -> httpx.Response:
    body = {
        "choices": [{"message": {"content": json.dumps({"is_target": is_target})}}],
        "usage": {"prompt_tokens": 100, "completion_tokens": 5},
    }
    return httpx.Response(200, json=body)


def test_eval_6_crop_is_2x_box_min_256_and_clamped():
    url = _data_url()
    crop = crop_for_verify(url, (100, 100, 200, 160), 800, 600)  # 100x60 box -> 256x256 min
    raw = base64.b64decode(crop.split(",", 1)[1])
    with Image.open(io.BytesIO(raw)) as im:
        assert im.size == (256, 256)


@respx.mock
def test_eval_6_verify_yes_and_no():
    respx.post(URL).mock(side_effect=[_reply(True), _reply(False)])
    assert asyncio.run(verify(_data_url(), "Save", "save the file", SETTINGS)) is True
    assert asyncio.run(verify(_data_url(), "Save", "save the file", SETTINGS)) is False


@respx.mock
def test_eval_6_verify_failure_returns_none_not_false():
    respx.post(URL).mock(return_value=httpx.Response(500, json={}))
    assert asyncio.run(verify(_data_url(), "Save", "save", SETTINGS)) is None


@respx.mock
def test_eval_6_verify_uses_full_token_budget():
    # Live Day 3: max_tokens=64 was consumed by reasoning tokens and content came back null.
    route = respx.post(URL).mock(return_value=_reply(True))
    assert asyncio.run(verify(_data_url(), "Save", "save", SETTINGS)) is True
    body = json.loads(route.calls[0].request.content)
    assert body["max_tokens"] >= 256


def test_eval_6_verifier_off_by_default():
    assert Settings().verifier_enabled is False


def test_priv_6_base_url_must_be_meta_host():
    import pytest

    with pytest.raises(ValueError):
        Settings(base_url="https://evil.example/v1")
