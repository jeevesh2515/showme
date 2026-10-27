"""Spike (c6): end-to-end highlight preview. Grounding model -> (point, bbox) -> highlight. Compares highlight
quality (box IoU vs ground truth) for three strategies:
  model_box : draw the grounding model's own bbox (no SAM)
  sam_point : SAM 3.1 prompted with the model's point
  sam_box   : SAM 3.1 prompted with the model's bbox
Click accuracy (point-in-box) is the model's point in every strategy (SAM never moves the click; see c4/c5).
    set -a; . ../../.env; set +a; .venv/bin/python pipeline_preview.py muse-spark-1.3
"""
import base64
import json
import mimetypes
import os
import re
import sys
import time
import urllib.request

from meta_sam_parser import FramePrompt, PromptBox, PromptObject, PromptPoint, build_object_prompt
from PIL import Image

sys.path.insert(0, "../grounding")
import smoke  # noqa: E402  (grounding call, schema, prompt)
from api_sam import BOX, KEY, URL  # noqa: E402
from run import CASES, FIX, iou  # noqa: E402

INSTR = ["cancel the subscription", "update my payment method", "enter my card number",
         "change my primary email", "remove the saved card", "delete my account"]


def sam(path: str, prompt_obj: FramePrompt) -> tuple:
    w, h = Image.open(path).size
    text = build_object_prompt(size=(w, h), objects=[PromptObject(id=1, prompts=[prompt_obj])])
    mime = mimetypes.guess_type(path)[0] or "image/png"
    img = f"data:{mime};base64,{base64.b64encode(open(path, 'rb').read()).decode()}"
    body = {"model": "sam-3.1", "input": [{"type": "message", "role": "user", "content": [
        {"type": "input_text", "text": text}, {"type": "input_image", "image_url": img}]}]}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.load(r)
    out = resp.get("output_text") or "".join(c.get("text", "") for o in resp.get("output", []) for c in o.get("content", []) or [])
    m = BOX.search(out)
    return tuple(int(v) for v in m.groups()) if m else None


def main(model: str) -> None:
    items = [(FIX + f, INSTR[i], gt) for i, (f, _, _, gt) in enumerate(CASES)]
    data = "../data/screenspot10/"
    items += [(data + s["file"], s["instruction"], tuple(s["bbox_px"])) for s in json.load(open(data + "samples.json"))]
    agg = {"model_box": [], "sam_point": [], "sam_box": []}
    hits = 0
    lat = []
    for path, instr, gt in items:
        W, H = Image.open(path).size
        t0 = time.perf_counter()
        out, _, _ = smoke.call(KEY, model, path, instr)
        px, py = (min(max(out["point"][k], 0), 1000) for k in ("x", "y"))
        pt = [int(px * W / 1000), int(py * H / 1000)]
        b = [min(max(v, 0), 1000) for v in out["bbox"]]
        mbox = (int(b[0] * W / 1000), int(b[1] * H / 1000), int(b[2] * W / 1000), int(b[3] * H / 1000))
        sp = sam(path, FramePrompt(points=[PromptPoint(x=pt[0], y=pt[1])]))
        sb = sam(path, FramePrompt(box=PromptBox(left=mbox[0], top=mbox[1], right=mbox[2], bottom=mbox[3])))
        lat.append((time.perf_counter() - t0) * 1000)
        hit = gt[0] <= pt[0] <= gt[2] and gt[1] <= pt[1] <= gt[3]
        hits += hit
        r = {"model_box": iou(mbox, gt), "sam_point": iou(sp, gt) if sp else 0.0, "sam_box": iou(sb, gt) if sb else 0.0}
        for k, v in r.items():
            agg[k].append(v)
        print(f"{os.path.basename(path):22s} {'HIT ' if hit else 'MISS'} " + " ".join(f"{k}={v:.2f}" for k, v in r.items()) + f"  '{instr}'")
    n = len(items)
    print(f"\n{model}: click point-in-box {hits}/{n}")
    for k, v in agg.items():
        print(f"  {k:10s} mean IoU={sum(v) / n:.2f}  IoU>=0.5: {sum(x >= 0.5 for x in v)}/{n}")
    lat.sort()
    print(f"sequential step latency (ground + 2 SAM calls) p50={lat[n // 2]:.0f} ms max={lat[-1]:.0f} ms")


if __name__ == "__main__":
    smoke.EFFORT = os.environ.get("EFFORT", "minimal")
    main(sys.argv[1] if len(sys.argv) > 1 else "muse-spark-1.3")
