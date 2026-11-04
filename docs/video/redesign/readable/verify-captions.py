"""Read actual burned-caption starts and ends from a completed export."""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

out = Path("docs/video/out")
tag = sys.argv[1]
report = {}


def seconds(value):
    h, m, s = value.replace(",", ".").split(":")
    return int(h) * 3600 + int(m) * 60 + float(s)


for key, stem, crop in [
    ("film", "3min-hackathon", "1800:64:60:996"),
    ("x", "X-launch", "1824:80:48:984"),
]:
    path = out / f"ShowMe-{stem}-candidate-{tag}.mp4"
    cues = []
    for block in Path(f"{path}.srt").read_text().strip().split("\n\n"):
        a, b = block.splitlines()[1].split(" --> ")
        cues.append((seconds(a), seconds(b)))
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-vf",
        f"crop={crop},scale=450:24,format=gray", "-f", "rawvideo", "-",
    ])
    band = np.frombuffer(raw, np.uint8).reshape(-1, 24, 450)
    worst = 0.0
    for a, b in cues:
        reference = band[round((a + b) * 15)].astype(float)
        for time, start in [(a, True), (b, False)]:
            frame = round(time * 30)
            lo, hi = max(0, frame - 4), min(len(band), frame + 5)
            difference = np.abs(band[lo:hi].astype(float) - reference).mean(axis=(1, 2))
            same = np.flatnonzero(difference < 2) + lo
            assert len(same), (key, time)
            actual = (same.min() if start else same.max() + 1) / 30
            worst = max(worst, float(abs(actual - time)))
    assert worst <= 1 / 30 + .001, (key, worst)
    report[key] = {"cues": len(cues), "startsAndEndsChecked": True, "maximumDifferenceSeconds": worst}

target = out / f"{tag}-caption-boundaries.json"
target.write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report))
