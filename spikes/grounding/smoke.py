"""Spike (b): can Muse Spark return reliable click coordinates on a screenshot?
10-sample ScreenSpot smoke test via the Meta Model API (Chat Completions, JSON-schema output, 0-1000 grid).
Reports point-in-box accuracy, latency, and token usage (to price a step). Stdlib only.
    MODEL_API_KEY=... python3.11 -I smoke.py ../data/screenspot10 [muse-spark-1.3]
Request format per https://dev.meta.ai/docs/image-understanding and /docs/structured-output.
"""
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request

URL = "https://api.meta.ai/v1/chat/completions"
SCHEMA = {
    "type": "object",
    "properties": {
        "target_visible": {"type": "boolean"},
        "point": {"type": "object", "properties": {"x": {"type": "integer"}, "y": {"type": "integer"}},
                  "required": ["x", "y"], "additionalProperties": False},
        "bbox": {"type": "array", "items": {"type": "integer"}, "minItems": 4, "maxItems": 4},
        "confidence": {"type": "number"},
    },
    "required": ["target_visible", "point", "bbox", "confidence"],
    "additionalProperties": False,  # strict mode requires this on every object
}
PROMPT = (
    "You are a GUI grounding expert. The image is a screenshot. Find the single UI element that best matches "
    "the instruction below. Report its centre as point {x, y} and its box as [x_min, y_min, x_max, y_max] on a "
    "normalized 0-1000 grid where (0,0) is top-left and (1000,1000) is bottom-right. Set target_visible=false and "
    "confidence below 0.3 if the element is not on screen. confidence is your probability (0-1) that the point is "
    "inside the correct element.\nInstruction: {instruction}"
)


EFFORT = os.environ.get("EFFORT")  # reasoning_effort: minimal|low|medium|high; unset = model default
# Absent-target probes: the product must say "not on this screen" instead of guessing.
NEGATIVES = [
    ("00_windows_text.png", "open the shopping cart"),
    ("02_macos_text.png", "turn on airplane mode"),
    ("04_ios_icon.jpeg", "cancel my Netflix subscription"),
    ("07_gitlab_text.png", "play the next song"),
    ("09_forum_text.png", "log out of the banking app"),
]


def call(key: str, model: str, img_path: str, instruction: str) -> tuple[dict, dict, float]:
    mime = mimetypes.guess_type(img_path)[0] or "image/png"
    data_url = f"data:{mime};base64,{base64.b64encode(open(img_path, 'rb').read()).decode()}"
    body = {
        "model": model,
        "messages": [{"role": "user", "content": [
            {"type": "text", "text": PROMPT.replace("{instruction}", instruction)},
            {"type": "image_url", "image_url": {"url": data_url}},
        ]}],
        "response_format": {"type": "json_schema", "json_schema": {"name": "grounding", "schema": SCHEMA, "strict": True}},
        "temperature": 0,
    }
    if EFFORT:
        body["reasoning_effort"] = EFFORT
    req = urllib.request.Request(URL, json.dumps(body).encode(), {"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.load(r)
    ms = (time.perf_counter() - t0) * 1000
    return json.loads(resp["choices"][0]["message"]["content"]), resp.get("usage", {}), ms


def main(data_dir: str, model: str) -> None:
    key = os.environ.get("MODEL_API_KEY")
    if not key:
        sys.exit("MODEL_API_KEY not set: this spike needs a Meta Model API key (https://dev.meta.ai/docs/authentication)")
    samples = json.load(open(os.path.join(data_dir, "samples.json")))
    hits, lats, toks = 0, [], []
    for s in samples:
        w, h = s["size"]
        gt = s["bbox_px"]
        try:
            out, usage, ms = call(key, model, os.path.join(data_dir, s["file"]), s["instruction"])
        except urllib.error.HTTPError as e:
            print(f"{s['file']}: HTTP {e.code} {e.read()[:300]!r}")
            continue
        px = min(max(out["point"]["x"], 0), 1000) * w / 1000  # clamp: docs say values can slightly exceed 1000
        py = min(max(out["point"]["y"], 0), 1000) * h / 1000
        hit = gt[0] <= px <= gt[2] and gt[1] <= py <= gt[3]
        hits += hit
        lats.append(ms)
        toks.append((usage.get("prompt_tokens"), usage.get("completion_tokens"),
                     (usage.get("completion_tokens_details") or {}).get("reasoning_tokens")))
        print(f"{s['file']:24s} {'HIT ' if hit else 'MISS'} pred=({px:.0f},{py:.0f}) gt={gt} conf={out['confidence']:.2f} "
              f"visible={out['target_visible']} {ms:.0f} ms tokens={toks[-1]}")
    n = len(lats)
    if n:
        lats.sort()
        print(f"\n{model} effort={EFFORT or 'default'}: point-in-box {hits}/{n}  latency p50={lats[n // 2]:.0f} ms max={lats[-1]:.0f} ms")
        print(f"mean tokens in/out/reasoning: {sum(t[0] or 0 for t in toks) / n:.0f} / {sum(t[1] or 0 for t in toks) / n:.0f}"
              f" / {sum(t[2] or 0 for t in toks) / n:.0f}")
    honest = 0
    for file, instr in NEGATIVES:
        out, _, ms = call(key, model, os.path.join(data_dir, file), instr)
        ok = (not out["target_visible"]) or out["confidence"] < 0.3
        honest += ok
        print(f"NEG {file:22s} '{instr}' -> visible={out['target_visible']} conf={out['confidence']:.2f} {'OK' if ok else 'GUESSED'} {ms:.0f} ms")
    print(f"absent-target honesty: {honest}/{len(NEGATIVES)}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "muse-spark-1.3")
