"""Spike (c3): SAM returns 3 candidate masks per click. Which selection policy recovers the whole UI element
from an off-centre click? Same 48 seeded clicks as jitter.py. 'oracle' = any candidate is right (ceiling).
    python policies.py facebook/sam2.1-hiera-tiny mps
"""
import sys

import numpy as np
import torch
from PIL import Image

from run import CASES, FIX, iou
from transformers import Sam2Model, Sam2Processor, Sam3TrackerModel, Sam3TrackerProcessor

model_id, device = sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "cpu"
M, P = (Sam3TrackerModel, Sam3TrackerProcessor) if "sam3" in model_id else (Sam2Model, Sam2Processor)
model, proc = M.from_pretrained(model_id).to(device).eval(), P.from_pretrained(model_id)
rng = np.random.default_rng(0)
area = lambda b: (b[2] - b[0]) * (b[3] - b[1])


def candidates(img, pt, multimask=True):
    inputs = proc(images=img, input_points=[[[pt]]], input_labels=[[[1]]], return_tensors="pt").to(device)
    with torch.no_grad():
        out = model(**inputs, multimask_output=multimask)
    masks = proc.post_process_masks(out.pred_masks.cpu(), inputs["original_sizes"])[0][0]
    scores = out.iou_scores[0, 0].cpu().numpy()
    res = []
    for k in range(masks.shape[0]):
        ys, xs = np.nonzero(masks[k].numpy())
        if len(xs):
            res.append(((xs.min(), ys.min(), xs.max(), ys.max()), float(scores[k])))
    return res, masks.shape[1] * masks.shape[2]


POLICIES = {
    "single_mask": None,  # multimask_output=False
    "top_score": lambda c, A, lh: max(c, key=lambda x: x[1])[0],
    "largest<=25%": lambda c, A, lh: max([x for x in c if area(x[0]) <= 0.25 * A] or c, key=lambda x: area(x[0]))[0],
    "smallest_tall_enough": lambda c, A, lh: min([x for x in c if x[0][3] - x[0][1] >= lh] or c, key=lambda x: area(x[0]))[0],
}

hits = {k: 0 for k in [*POLICIES, "oracle"]}
n = 0
for file, label, _, gt in CASES:
    img = Image.open(FIX + file).convert("RGB")
    lh = 0.6 * (gt[3] - gt[1])  # stand-in for "taller than one text glyph"; product would use OCR line height
    for _ in range(8):
        pt = [int(rng.uniform(gt[0] + 2, gt[2] - 2)), int(rng.uniform(gt[1] + 2, gt[3] - 2))]
        c, A = candidates(img, pt)
        n += 1
        hits["oracle"] += any(iou(b, gt) >= 0.7 for b, _ in c)
        for name, pol in POLICIES.items():
            if pol is None:
                s, _ = candidates(img, pt, multimask=False)
                b = s[0][0] if s else None
            else:
                b = pol(c, A, lh) if c else None
            hits[name] += bool(b is not None and iou(b, gt) >= 0.7)
print(f"n={n} clicks, whole-element (IoU>=0.7) rate per policy:")
for k, v in hits.items():
    print(f"  {k:22s} {v}/{n} = {v / n:.0%}")
