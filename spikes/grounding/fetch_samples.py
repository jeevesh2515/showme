"""Fetch a small stratified ScreenSpot (v1, Apache-2.0, ungated) sample without the 602 MB download.
One text + one icon target per platform group -> 10 samples, saved as PNG + samples.json (pixel xyxy bbox).
    ../sam/.venv/bin/python -I fetch_samples.py ../data/screenspot
"""
import io
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image

DS = "bevaya/ScreenSpot"  # rootsautomation/ScreenSpot was renamed to this id on the Hub
API = "https://datasets-server.huggingface.co/rows"
# Rows are grouped by source; offsets found by probing (/filter timed out). One batch per source.
OFFSETS = {"windows": 0, "macos": 300, "ios": 450, "android": 750, "gitlab": 900, "forum": 1050, "tool": 1200}
PLATFORM = {"ios": "mobile", "android": "mobile", "macos": "desktop", "windows": "desktop"}


def fetch(url: str, tries: int = 4) -> bytes:
    # datasets-server returns sporadic 502s / timeouts; retry with backoff
    for i in range(tries):
        try:
            with urllib.request.urlopen(url, timeout=90) as r:
                return r.read()
        except (urllib.error.URLError, TimeoutError):
            if i == tries - 1:
                raise
            time.sleep(2 ** i)


def query(offset: int, length: int = 20) -> list[dict]:
    qs = urllib.parse.urlencode({"dataset": DS, "config": "default", "split": "test", "offset": offset, "length": length})
    return [x["row"] for x in json.loads(fetch(f"{API}?{qs}")).get("rows", [])]


def image_size(data: bytes) -> tuple[int, int]:
    return Image.open(io.BytesIO(data)).size  # mobile rows are JPEG, not PNG


def main(out: Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    picked: list[dict] = []
    want = {"mobile": 4, "desktop": 3, "web": 3}
    for src, offset in OFFSETS.items():
        plat = PLATFORM.get(src, "web")
        batch = query(offset)
        for dtype in ("text", "icon"):
            if sum(p["platform"] == plat for p in picked) >= want[plat]:
                break
            rows = [r for r in batch if r["data_source"] == src and r["data_type"] == dtype]
            if not rows:
                continue
            row = rows[0]
            img = fetch(row["image"]["src"])
            w, h = image_size(img)
            fname = f"{len(picked):02d}_{src}_{dtype}.{Image.open(io.BytesIO(img)).format.lower()}"
            (out / fname).write_bytes(img)
            x0, y0, x1, y1 = row["bbox"]  # normalised xyxy per the dataset card
            picked.append({
                "file": fname, "instruction": row["instruction"], "platform": plat, "source": src,
                "element_type": dtype, "size": [w, h],
                "bbox_px": [round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h)],
            })
            print(fname, plat, dtype, w, h, row["instruction"])
    (out / "samples.json").write_text(json.dumps(picked, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
