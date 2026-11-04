# Measures where the real Cancel subscription button sits in each source frame; no pixels are changed.
# Run: uv run --with numpy --with scipy --with pillow python -I track.py  (from repo root)
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = Path.cwd()
OUT = ROOT / "docs/video/out"
CACHE = OUT / "fixed-point-cache"
PHONE = OUT / "raw/recipient.mov"
WINDOWS = {"a": (6.2, 24.2), "b": (26.2, 29.6)}  # excludes keyboard 0-6.2 and app switcher 24.2-26.2

def extract():
    for k, (a, b) in WINDOWS.items():
        d = CACHE / f"phone-{k}"
        d.mkdir(parents=True, exist_ok=True)
        for old in d.glob("*.jpg"):
            old.unlink()
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(a), "-to", str(b), "-i", str(PHONE), "-vf", "fps=30", "-q:v", "2", str(d / "%05d.jpg")], check=True)

def ring(rgb):
    # Ring stroke: saturated yellow, low fill inside its bbox. Filled yellow cards and the round badge are rejected.
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    mask = (r > 225) & (g > 180) & (g < 235) & (b < 110)
    lab, n = ndi.label(mask)
    best = None
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        area = int((lab[sl] == i).sum())
        if w < 40 or h < 12 or w / h < 1.8 or w / h > 8 or area / (w * h) > 0.75:
            continue
        if best is None or w > best[2]:
            best = (sl[1].start, sl[0].start, w, h)
    return best

def blue(rgb):
    # Update payment method is the only saturated blue block; Cancel subscription sits to its right.
    r, g, b = [rgb[..., i].astype(int) for i in range(3)]
    mask = (b > 180) & (r < 70) & (g < 110)
    lab, n = ndi.label(mask)
    objs = ndi.find_objects(lab)
    if not objs:
        return None
    sl = max(objs, key=lambda s: (s[0].stop - s[0].start) * (s[1].stop - s[1].start))
    w, h = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
    return (sl[1].start, sl[0].start, w, h) if w > 40 and h > 10 else None

def main():
    if "--extract" in sys.argv:
        extract()
    res = {"phone": {}, "main": {}}
    d = CACHE / "phone-a"
    rows = []
    for f in sorted(d.glob("*.jpg")):
        b = ring(np.asarray(Image.open(f).convert("RGB")))
        rows.append(None if b is None else [b[0] + b[2] / 2, b[1] + b[3] / 2, b[2], b[3]])
    res["phone"]["a"] = rows
    res["phone"]["b"] = [blue(np.asarray(Image.open(f).convert("RGB"))) for f in sorted((CACHE / "phone-b").glob("*.jpg"))]
    res["absent"] = blue(np.asarray(Image.open(OUT / "raw/absent-final.png").convert("RGB")))
    tl = json.load(open(OUT / "raw/main/timeline.json"))
    t0 = tl["frames"][0]["t"]
    for fr in tl["frames"]:
        rgb = np.asarray(Image.open(OUT / f"raw/main/f{fr['n']:06d}.jpg").convert("RGB"))
        res["main"][fr["n"]] = {"t": round(fr["t"] - t0, 3), "blue": blue(rgb), "ring": ring(rgb)}
    json.dump(res, open(CACHE / "tracks.json", "w"))
    a = [x for x in rows if x]
    print("phone-a frames", len(rows), "ring found", len(a))
main()
