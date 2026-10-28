#!/usr/bin/env python3.11
"""Day 2 live check: POST spikes/redaction/fixtures/billing.png to local /v1/step + /v1/refine.
Saves raw Meta-shaped fixtures for tests (no key, no private data - synthetic fixture page).
Usage: set -a; . ./.env; set +a; python3.11 scripts/day2_step_check.py [base_url]
"""
import base64
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"


def post(path: str, body: dict) -> dict:
    req = urllib.request.Request(BASE + path, json.dumps(body).encode(), {"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def main() -> None:
    from PIL import Image
    import io

    png = ROOT / "spikes/redaction/fixtures/billing.png"
    w, h = Image.open(png).size
    buf = io.BytesIO()
    Image.open(png).convert("RGB").save(buf, "JPEG", quality=85)
    data_url = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    step = post("/v1/step", {
        "goal": "cancel my subscription", "history": [], "image": data_url,
        "image_meta": {"width": w, "height": h, "redaction": {"auto_regions": 0, "manual_regions": 0, "pipeline": "v1"}},
        "locale": "en-GB", "escalate": False,
    })
    print("STEP", json.dumps(step, indent=1)[:1200])
    target = step.get("target")
    if target:
        ref = post("/v1/refine", {"image": data_url, "image_meta": {"width": w, "height": h, "redaction": {"auto_regions": 0, "manual_regions": 0, "pipeline": "v1"}}, "box": target["box"], "point": target["point"]})
        print("REFINE mode=", ref.get("mode"), "svg_len=", len(ref.get("svg_path") or ""), "cost=", ref.get("cost_usd"))


if __name__ == "__main__":
    main()
