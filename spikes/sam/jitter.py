"""Spike (c2): grounding models rarely click the exact centre. Click 8 seeded random points inside each
element box (incl. on glyph strokes and near edges) and check whether the returned mask still covers the
whole element (IoU >= 0.7), only a part (letter / icon), or spills into the container.
    python jitter.py facebook/sam2.1-hiera-tiny mps
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

tot = {"whole": 0, "part": 0, "spill": 0, "none": 0}
for file, label, _, gt in CASES:
    img = Image.open(FIX + file).convert("RGB")
    res = {"whole": 0, "part": 0, "spill": 0, "none": 0}
    for _ in range(8):
        pt = [int(rng.uniform(gt[0] + 2, gt[2] - 2)), int(rng.uniform(gt[1] + 2, gt[3] - 2))]
        inputs = proc(images=img, input_points=[[[pt]]], input_labels=[[[1]]], return_tensors="pt").to(device)
        with torch.no_grad():
            out = model(**inputs, multimask_output=True)
        masks = proc.post_process_masks(out.pred_masks.cpu(), inputs["original_sizes"])[0][0]
        boxes = []
        for k in range(masks.shape[0]):
            ys, xs = np.nonzero(masks[k].numpy())
            if len(xs):
                boxes.append((xs.min(), ys.min(), xs.max(), ys.max()))
        # policy under test: among the 3 candidates, take the one whose box best matches a "control-sized" region:
        # contains the click, area <= 25% of the image. This is what the product would do without knowing gt.
        H, W = masks.shape[1:]
        ok = [b for b in boxes if b[0] <= pt[0] <= b[2] and b[1] <= pt[1] <= b[3] and (b[2] - b[0]) * (b[3] - b[1]) <= 0.25 * W * H]
        if not ok:
            res["none"] += 1
            continue
        b = max(ok, key=lambda b: (b[2] - b[0]) * (b[3] - b[1]))  # largest control-sized candidate
        score = iou(b, gt)
        area_b, area_gt = (b[2] - b[0]) * (b[3] - b[1]), (gt[2] - gt[0]) * (gt[3] - gt[1])
        res["whole" if score >= 0.7 else ("spill" if area_b > area_gt else "part")] += 1
    for k in tot:
        tot[k] += res[k]
    print(f"{label:42s} {res}")
print(f"TOTAL {tot}  whole-element rate={tot['whole'] / sum(tot.values()):.0%}")
