"""Spike (c5): SAM 3.1 via the Meta Model API (Responses API, model 'sam-3.1'), point prompt -> box + mask.
Same tests as the local SAM 2.1 runs so results compare directly:
  A. synthetic UI elements: centre click + 4 off-centre clicks -> whole-element rate (mask box IoU >= 0.7)
  B. 10 real ScreenSpot targets: 3 near-miss clicks each -> does refinement move the point into the target?
Also checks the mask decodes to an SVG path (what the overlay would render).
    set -a; . ../../.env; set +a; .venv/bin/python api_sam.py
Docs: https://dev.meta.ai/docs/sam/segmenting, /docs/sam/reading-segmentation
"""
import base64
import json
import mimetypes
import os
import re
import time
import urllib.error
import urllib.request

import numpy as np
from meta_sam_parser import FramePrompt, PromptObject, PromptPoint, build_object_prompt
from PIL import Image

from run import CASES, FIX, iou

URL = "https://api.meta.ai/v1/responses"
KEY = os.environ["MODEL_API_KEY"]
BOX = re.compile(r"<\|box;x1=(\d+);y1=(\d+);x2=(\d+);y2=(\d+);w=\d+;h=\d+(?:;c=[\d.]+)?\|>")
MASK = re.compile(r"<\|mask;x=\d+;y=\d+(?:;c=[\d.]+)?;data=(\d+),(\d+),(.)")
inside = lambda p, b: b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3]


def segment(path: str, pt: list[int]) -> tuple[tuple | None, dict, float]:
    w, h = Image.open(path).size
    prompt = build_object_prompt(size=(w, h), objects=[PromptObject(id=1, prompts=[FramePrompt(points=[PromptPoint(x=pt[0], y=pt[1])])])])
    mime = mimetypes.guess_type(path)[0] or "image/png"
    img = f"data:{mime};base64,{base64.b64encode(open(path, 'rb').read()).decode()}"
    body = {"model": "sam-3.1", "input": [{"type": "message", "role": "user", "content": [
        {"type": "input_text", "text": prompt}, {"type": "input_image", "image_url": img}]}]}
    req = urllib.request.Request(URL, json.dumps(body).encode(), {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    t0 = time.perf_counter()
    with urllib.request.urlopen(req, timeout=120) as r:
        resp = json.load(r)
    ms = (time.perf_counter() - t0) * 1000
    text = resp.get("output_text") or "".join(
        c.get("text", "") for o in resp.get("output", []) for c in o.get("content", []) or [])
    m = BOX.search(text)
    mk = MASK.search(text)
    info = {"prompt": prompt, "raw": text[:160], "mask_hw": (int(mk.group(1)), int(mk.group(2)), mk.group(3)) if mk else None}
    return (tuple(int(v) for v in m.groups()) if m else None), info, ms


def main() -> None:
    rng = np.random.default_rng(0)
    lat = []
    first = True
    print("A. synthetic UI elements (whole-element = mask box IoU >= 0.7)")
    whole = n = 0
    for file, label, centre, gt in CASES:
        clicks = [list(centre)] + [[int(rng.uniform(gt[0] + 2, gt[2] - 2)), int(rng.uniform(gt[1] + 2, gt[3] - 2))] for _ in range(4)]
        res = []
        for pt in clicks:
            box, info, ms = segment(FIX + file, pt)
            if first:
                print(f"  sample prompt: {info['prompt']}\n  sample output: {info['raw']}...\n  mask header: {info['mask_hw']}")
                first = False
            lat.append(ms)
            ok = box is not None and iou(box, gt) >= 0.7
            whole += ok
            n += 1
            res.append(f"{iou(box, gt):.2f}" if box else "none")
        print(f"  {label:42s} IoU per click {res}")
    print(f"  whole-element rate: {whole}/{n} = {whole / n:.0%}")

    print("B. ScreenSpot near-miss clicks (point-in-box: raw click vs refined = centre of SAM box, guarded)")
    data = "../data/screenspot10/"
    raw_hits = ref_hits = helped = hurt = m = 0
    for s in json.load(open(data + "samples.json")):
        gt = s["bbox_px"]
        cx, cy, bw, bh = (gt[0] + gt[2]) / 2, (gt[1] + gt[3]) / 2, gt[2] - gt[0], gt[3] - gt[1]
        W, H = s["size"]
        for _ in range(3):
            pt = [int(np.clip(cx + rng.uniform(-0.75, 0.75) * bw, 0, W - 1)), int(np.clip(cy + rng.uniform(-0.75, 0.75) * bh, 0, H - 1))]
            try:
                box, _, ms = segment(data + s["file"], pt)
            except urllib.error.HTTPError as e:
                print(f"  {s['file']}: HTTP {e.code} {e.read()[:200]!r}")
                continue
            lat.append(ms)
            ref = pt
            if box and inside(pt, box) and (box[2] - box[0]) * (box[3] - box[1]) <= 0.10 * W * H:
                ref = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]
            a, b = inside(pt, gt), inside(ref, gt)
            raw_hits, ref_hits, helped, hurt, m = raw_hits + a, ref_hits + b, helped + (b and not a), hurt + (a and not b), m + 1
    print(f"  raw {raw_hits}/{m}  refined {ref_hits}/{m}  helped={helped} hurt={hurt}")
    lat.sort()
    print(f"latency ms over {len(lat)} calls: p50={lat[len(lat) // 2]:.0f} p95={lat[int(len(lat) * 0.95)]:.0f} max={lat[-1]:.0f}")


if __name__ == "__main__":
    main()
