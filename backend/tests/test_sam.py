import asyncio
import base64
import io

import httpx
import respx
from PIL import Image

from showme.core.sam import refine
from showme.core.schema import BoxPx, PointPx
from showme.core.settings import Settings

URL = "https://api.meta.ai/v1/responses"
SETTINGS = Settings(api_key="test")


def img_url(w=100, h=100):
    buf = io.BytesIO()
    Image.new("RGB", (w, h), "white").save(buf, "PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


def sam_reply(text):
    return httpx.Response(200, json={"output_text": text})


@respx.mock
def test_api_4_sam_failure_returns_box():
    respx.post(URL).mock(return_value=httpx.Response(500, json={}))
    r = asyncio.run(refine(img_url(), BoxPx(x1=10, y1=10, x2=50, y2=50), PointPx(x=30, y=30), SETTINGS))
    assert r.mode == "box" and r.cost_usd == 0.0025


@respx.mock
def test_api_4_agreement_gate_rejects_disagreeing_box():
    # SAM box far from model box -> IoU < 0.5 -> box fallback, no outline.
    text = "<|box;x1=80;y1=80;x2=95;y2=95;w=100;h=100|><|mask;x=1;y=1;data=2,2,!xx|>"
    respx.post(URL).mock(return_value=sam_reply(text))
    r = asyncio.run(refine(img_url(), BoxPx(x1=10, y1=10, x2=50, y2=50), PointPx(x=30, y=30), SETTINGS))
    assert r.mode == "box" and r.svg_path is None


@respx.mock
def test_api_4_timeout_returns_box():
    respx.post(URL).mock(side_effect=httpx.ReadTimeout("slow"))
    r = asyncio.run(refine(img_url(), BoxPx(x1=10, y1=10, x2=50, y2=50), PointPx(x=30, y=30), SETTINGS))
    assert r.mode == "box"


@respx.mock
def test_api_4_recorded_sam_response_decodes_to_outline():
    # Real sam-3.1 response recorded 2026-10-28 (synthetic billing fixture, no PII/key).
    # Regression: base85 payload contains "|" - a [^|] regex truncated it and refine fell back to box.
    import json
    from pathlib import Path

    fixture = json.loads((Path(__file__).parent / "fixtures/sam_billing.json").read_text())
    respx.post(URL).mock(return_value=httpx.Response(200, json={"output_text": fixture["output_text"]}))
    box = BoxPx(x1=394, y1=640, x2=564, y2=680)
    r = asyncio.run(refine(img_url(1280, 800), box, PointPx(x=478, y=660), SETTINGS))
    assert r.mode == "outline" and r.svg_path and r.svg_path.startswith("M")
    assert r.origin is not None and r.box is not None


def test_api_4_sam_timeout_setting_is_4s():
    assert Settings().sam_timeout_s == 4.0


@respx.mock
def test_api_4_rejects_sam_box_missing_point_or_too_large():
    # SAM box agrees by IoU but does not contain the model point -> box fallback.
    text = "<|box;x1=10;y1=10;x2=50;y2=50;w=100;h=100;c=0.9|><|mask;x=1;y=1;data=2,2,!xx|>"
    respx.post(URL).mock(return_value=sam_reply(text))
    r = asyncio.run(refine(img_url(), BoxPx(x1=10, y1=10, x2=50, y2=50), PointPx(x=90, y=90), SETTINGS))
    assert r.mode == "box"
