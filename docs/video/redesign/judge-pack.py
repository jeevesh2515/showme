# Builds per-section frame sheets and motion metrics from the final media, for section judges.
# Run from the repo root: uv run -q --with numpy --with pillow python -I docs/video/redesign/judge-pack.py <tag> [anchor-tag]
import json, subprocess, sys
from pathlib import Path
import numpy as np
from PIL import Image

TAG = sys.argv[1]
ANCHOR = sys.argv[2] if len(sys.argv) > 2 else "fixed-point-20261104-v3"
OUT = Path("docs/video/out")
PACK = OUT / f"judge-{TAG}"
T = json.loads(Path("docs/video/redesign/timing.json").read_text())
NAMES = {"film": "ShowMe-3min-hackathon-candidate", "x": "ShowMe-X-launch-candidate"}
TITLE = {"film": ["hook", "privacy review", "Spark and SAM", "share and phone", "engineering", "not visible and evidence", "close"], "x": ["hook", "privacy", "Spark and SAM", "link and phone", "evidence", "close"]}
SRT = lambda p: Path(p).read_text()

def frame(path, t, w):
    h = w * 9 // 16
    raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", str(path), "-frames:v", "1", "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
    return Image.frombuffer("RGB", (w, h), raw)

def sheet(path, start, dur, step, w, cols, out):
    times = np.arange(start + 0.45, start + dur - 0.02, step)
    h = w * 9 // 16
    rows = (len(times) + cols - 1) // cols
    S = Image.new("RGB", (w * cols, h * rows), (0, 0, 0))
    for i, t in enumerate(times):
        S.paste(frame(path, float(t), w), ((i % cols) * w, (i // cols) * h))
    S.save(out, quality=86)
    return [round(float(t - start), 2) for t in times]

index = {}
for key in ("film", "x"):
    path = OUT / f"{NAMES[key]}-{TAG}.mp4"
    anchor = OUT / f"{NAMES[key]}-{ANCHOR}.mp4"
    ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vf", "scale=96:54,format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    small = np.frombuffer(ff.stdout.read(), np.uint8).reshape(-1, 54, 96).astype(int)
    ff.wait()
    d = np.abs(np.diff(small, axis=0))
    start = 0.0
    for i, dur in enumerate(T[key]):
        name = f"{key}-{i}"
        sec = PACK / name
        sec.mkdir(parents=True, exist_ok=True)
        step = max(0.5 if key == "x" else 1.0, dur / 24)
        a, b = int(start * 30), int((start + dur) * 30)
        seg = d[a:b - 1]
        times = sheet(path, start, dur, step, 640, 3, sec / "sheet.jpg")
        sheet(path, start, dur, max(step * 2, dur / 6), 600, 3, sec / "feed-size.jpg") if key == "x" else None
        sheet(anchor, start, dur, dur / 6, 320, 6, sec / "anchor-previous-cut.jpg")
        for label, t in (("start", start + 0.6), ("middle", start + dur / 2), ("end", start + dur - 0.4)):
            frame(path, t, 1920).save(sec / f"full-{label}.jpg", quality=90)
        srt = [c for c in SRT(f"{path}.srt").strip().split("\n\n")]
        metrics = {"section": name, "title": TITLE[key][i], "startSeconds": round(start, 3), "durationSeconds": dur, "sheetFrameTimesFromSectionStart": times, "hardJumpsInSection": int(((seg > 24).mean(axis=(1, 2)) > 0.12).sum()), "meanFrameChange": round(float(seg.mean()), 3)}
        (sec / "metrics.json").write_text(json.dumps(metrics, indent=1))
        index[name] = metrics
        start += dur
(PACK / "index.json").write_text(json.dumps(index, indent=1))
print(PACK, len(index))
