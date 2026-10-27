"""Spike (c4): SAM point->mask on 10 real ScreenSpot screenshots.
For each target, 10 seeded clicks scattered around the ground-truth box (up to 0.75x box size off-centre, so
some land outside it) simulate an imperfect grounding model. Compare point-in-box accuracy of the raw click vs
the refined point (centre of the SAM mask box). Guard: if the mask is huge (>10% of image) or does not contain
the click, keep the raw click. This is the proxy for the 'model alone vs model + SAM' ablation.
    python screenspot_sam.py facebook/sam2.1-hiera-tiny mps
"""
import json
import sys
import time

import numpy as np
import torch
from PIL import Image

from transformers import Sam2Model, Sam2Processor, Sam3TrackerModel, Sam3TrackerProcessor

DATA = "../data/screenspot10/"
model_id, device = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "cpu"
M, P = (Sam3TrackerModel, Sam3TrackerProcessor) if "sam3" in model_id else (Sam2Model, Sam2Processor)
model, proc = M.from_pretrained(model_id).to(device).eval(), P.from_pretrained(model_id)
rng = np.random.default_rng(0)
inside = lambda p, b: b[0] <= p[0] <= b[2] and b[1] <= p[1] <= b[3]

raw_hits = ref_hits = n = 0
helped = hurt = guarded = 0
lat = []
for s in json.load(open(DATA + "samples.json")):
    img = Image.open(DATA + s["file"]).convert("RGB")
    gt = s["bbox_px"]
    cx, cy, w, h = (gt[0] + gt[2]) / 2, (gt[1] + gt[3]) / 2, gt[2] - gt[0], gt[3] - gt[1]
    r_raw = r_ref = 0
    for _ in range(10):
        pt = [int(np.clip(cx + rng.uniform(-0.75, 0.75) * w, 0, img.width - 1)),
              int(np.clip(cy + rng.uniform(-0.75, 0.75) * h, 0, img.height - 1))]
        inputs = proc(images=img, input_points=[[[pt]]], input_labels=[[[1]]], return_tensors="pt").to(device)
        t0 = time.perf_counter()
        with torch.no_grad():
            out = model(**inputs, multimask_output=False)
        if device == "mps":
            torch.mps.synchronize()
        lat.append((time.perf_counter() - t0) * 1000)
        mask = proc.post_process_masks(out.pred_masks.cpu(), inputs["original_sizes"])[0][0][0].numpy()
        ys, xs = np.nonzero(mask)
        ref = pt
        if len(xs) and len(xs) <= 0.10 * mask.size:
            box = (xs.min(), ys.min(), xs.max(), ys.max())
            if inside(pt, box):
                ref = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]
        if ref is pt:
            guarded += 1
        a, b = inside(pt, gt), inside(ref, gt)
        r_raw += a
        r_ref += b
        helped += (not a) and b
        hurt += a and not b
        n += 1
    raw_hits += r_raw
    ref_hits += r_ref
    print(f"{s['file']:24s} {s['platform']:7s} {s['element_type']:4s} box={w}x{h:<5} raw {r_raw}/10  refined {r_ref}/10  '{s['instruction']}'")
print(f"\nTOTAL raw={raw_hits}/{n} ({raw_hits / n:.0%})  refined={ref_hits}/{n} ({ref_hits / n:.0%})  "
      f"helped={helped} hurt={hurt} guard_kept_raw={guarded}")
lat = lat[1:]
print(f"latency ms (full call incl. image encode): p50={np.percentile(lat, 50):.0f} p95={np.percentile(lat, 95):.0f}")
