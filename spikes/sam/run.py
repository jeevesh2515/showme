"""Spike (c): point prompt -> mask on UI screenshots. Measures mask-box IoU vs a hand-measured
element box and per-call latency. Model id is an arg so SAM 3 can be swapped in once access is granted:
    python run.py facebook/sam2.1-hiera-tiny mps
    python run.py facebook/sam3 mps        # needs gated HF access
"""
import sys
import time

import numpy as np
import torch
from PIL import Image, ImageDraw
from transformers import Sam2Model, Sam2Processor, Sam3TrackerModel, Sam3TrackerProcessor

FIX = "../redaction/fixtures/"
# (file, label, click point, ground-truth element box xyxy) - boxes measured from the rendered PNGs.
CASES = [
    ("billing.png", "button: Cancel subscription", (479, 632), (395, 613, 564, 651)),
    ("billing.png", "button: Update payment method", (290, 632), (190, 614, 390, 651)),
    ("billing.png", "input: Card number", (640, 335), (190, 316, 1090, 355)),
    ("settings.png", "button: Change (2x, dark)", (1458, 312), (1384, 282, 1532, 343)),
    ("settings.png", "button: Remove (2x, dark)", (1486, 970), (1410, 940, 1564, 1001)),
    ("settings.png", "text link: Delete account (no border)", (155, 326), (49, 311, 261, 343)),
]


def iou(a, b):
    ix = max(0, min(a[2], b[2]) - max(a[0], b[0]))
    iy = max(0, min(a[3], b[3]) - max(a[1], b[1]))
    inter = ix * iy
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union else 0.0


def main(model_id: str, device: str) -> None:
    t0 = time.perf_counter()
    # AutoModel resolves SAM repos to the video model; the image click API is the *Tracker / Sam2Model class.
    M, P = (Sam3TrackerModel, Sam3TrackerProcessor) if "sam3" in model_id else (Sam2Model, Sam2Processor)
    model = M.from_pretrained(model_id).to(device).eval()
    proc = P.from_pretrained(model_id)
    print(f"model={model_id} device={device} load_s={time.perf_counter() - t0:.1f}")

    lat = []
    for i, (file, label, pt, gt) in enumerate(CASES):
        img = Image.open(FIX + file).convert("RGB")
        inputs = proc(images=img, input_points=[[[list(pt)]]], input_labels=[[[1]]], return_tensors="pt").to(device)
        start = time.perf_counter()
        with torch.no_grad():
            out = model(**inputs, multimask_output=True)
        if device == "mps":
            torch.mps.synchronize()
        ms = (time.perf_counter() - start) * 1000
        masks = proc.post_process_masks(out.pred_masks.cpu(), inputs["original_sizes"])[0][0]  # (3, H, W)
        scores = out.iou_scores[0, 0].cpu().numpy()
        # pick the candidate mask whose bbox contains the click and has the best predicted IoU
        best = None
        for k in np.argsort(-scores):
            ys, xs = np.nonzero(masks[k].numpy())
            if len(xs) == 0:
                continue
            box = (xs.min(), ys.min(), xs.max(), ys.max())
            if box[0] <= pt[0] <= box[2] and box[1] <= pt[1] <= box[3]:
                best = (k, box)
                break
        if i > 0:  # first call includes warm-up
            lat.append(ms)
        if best is None:
            print(f"{label:42s} no mask contains the click  {ms:6.0f} ms")
            continue
        k, box = best
        print(f"{label:42s} IoU={iou(box, gt):.2f} mask_box={tuple(int(v) for v in box)} gt={gt} {ms:6.0f} ms")
        vis = img.copy()
        d = ImageDraw.Draw(vis)
        d.rectangle(gt, outline=(0, 200, 0), width=3)
        d.rectangle(box, outline=(255, 0, 0), width=3)
        d.ellipse((pt[0] - 6, pt[1] - 6, pt[0] + 6, pt[1] + 6), fill=(255, 0, 255))
        vis.crop((max(0, gt[0] - 120), max(0, gt[1] - 80), gt[2] + 120, gt[3] + 80)).save(f"out_{model_id.split('/')[-1]}_{i}.png")
    print(f"warm latency ms: p50={np.percentile(lat, 50):.0f} max={max(lat):.0f} (n={len(lat)})")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "cpu")
