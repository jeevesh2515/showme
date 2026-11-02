"""Synthetic scratch voice, one file per sentence, so the edit and captions can be timed. Run from the repo root."""

import json
import re
import subprocess

VOICE, RATE = "Daniel (English (UK))", "160"
index = {}
for name, path in (("film", "docs/video/narration.txt"), ("x", "docs/video/x-narration.txt")):
    for i, para in enumerate(open(path, encoding="utf8").read().strip().split("\n\n")):
        rows = []
        for j, text in enumerate(re.split(r"(?<=[.?!:])\s+(?=[\u201cA-Z0-9])", para)):
            f = f"docs/video/out/voice/{name}-{i}-{j}.aiff"
            spoken = text.replace("1,173", "eleven seventy-three").replace("1,172", "eleven seventy-two")
            subprocess.run(["say", "-v", VOICE, "-r", RATE, "-o", f, spoken], check=True)
            d = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
            rows.append([f, text, d])
        index[f"{name}-{i}"] = rows
        print(f"{name}-{i}", [round(r[2], 1) for r in rows], round(sum(r[2] for r in rows) + 0.25 * (len(rows) - 1), 1))
json.dump(index, open("docs/video/out/voice/index.json", "w"), indent=0)
