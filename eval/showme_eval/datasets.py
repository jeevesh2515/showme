"""Dataset loaders and splits.

v2 annotations are absolute xywh (verified against the HF files on 2026-10-28);
Pro annotations are absolute xyxy. Neither dataset ships a normalised box.
"""

from __future__ import annotations

import json
import random
from collections.abc import Sequence
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageDraw

Box = tuple[float, float, float, float]


@dataclass(frozen=True)
class Sample:
    id: str
    instruction: str
    image_path: Path
    bbox_xyxy_px: Box
    width: int
    height: int
    platform: str
    element_type: str  # v2 data_type / Pro ui_type
    group: str = ""  # Pro group / v2 data_source


def xywh_to_xyxy(bbox: Sequence[float]) -> Box:
    x, y, w, h = bbox
    return (float(x), float(y), float(x + w), float(y + h))


def _size(path: Path) -> tuple[int, int]:
    try:
        with Image.open(path) as im:
            return im.size
    except OSError:
        return (0, 0)


def _find_image(root: Path, name: str) -> Path:
    for candidate in (root / "images" / name, root / name):
        if candidate.exists():
            return candidate
    return root / "images" / name


def load_v2_local(data_dir: Path) -> list[Sample]:
    """Read screenspot_{desktop,mobile,web}_v2.json plus images from data_dir."""
    data_dir = Path(data_dir)
    files = sorted(data_dir.glob("*_v2.json"))
    if not files:
        raise FileNotFoundError(f"no *_v2.json annotation files in {data_dir}")
    samples: list[Sample] = []
    for path in files:
        platform = path.name.split("_")[1]
        for i, row in enumerate(json.loads(path.read_text())):
            image_path = _find_image(data_dir, row["img_filename"])
            width, height = _size(image_path)
            samples.append(
                Sample(
                    id=f"v2-{platform}-{i}",
                    instruction=row["instruction"],
                    image_path=image_path,
                    bbox_xyxy_px=xywh_to_xyxy(row["bbox"]),
                    width=width,
                    height=height,
                    platform=platform,
                    element_type=row.get("data_type", ""),
                    group=row.get("data_source", ""),
                )
            )
    return samples


def load_pro_local(data_dir: Path) -> list[Sample]:
    """Read annotations/*.json plus images/<img_filename> from data_dir."""
    data_dir = Path(data_dir)
    files = sorted((data_dir / "annotations").glob("*.json"))
    if not files:
        raise FileNotFoundError(
            f"no annotation JSON files in {data_dir / 'annotations'}"
        )
    samples: list[Sample] = []
    for path in files:
        for i, row in enumerate(json.loads(path.read_text())):
            image_path = data_dir / "images" / row["img_filename"]
            width, height = row.get("img_size") or _size(image_path)
            samples.append(
                Sample(
                    id=str(row.get("id") or f"pro-{path.stem}-{i}"),
                    instruction=row["instruction"],
                    image_path=image_path,
                    bbox_xyxy_px=tuple(float(v) for v in row["bbox"]),  # type: ignore[arg-type]
                    width=int(width),
                    height=int(height),
                    platform=row.get("platform", ""),
                    element_type=row.get("ui_type", ""),
                    group=row.get("group", ""),
                )
            )
    return samples


def _shuffled(samples: Sequence[Sample], seed: int) -> list[Sample]:
    out = list(samples)
    random.Random(seed).shuffle(out)
    return out


def dev_split(samples: Sequence[Sample], seed: int = 0, n: int = 100) -> list[Sample]:
    return _shuffled(samples, seed)[:n]


def heldout_split(
    samples: Sequence[Sample], seed: int = 0, n_dev: int = 100
) -> list[Sample]:
    return _shuffled(samples, seed)[n_dev:]


def draw_debug(samples: Sequence[Sample], out_dir: Path, limit: int = 5) -> list[Path]:
    """Draw GT boxes onto copies of the images so the format can be eyeballed."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    written: list[Path] = []
    for sample in list(samples)[:limit]:
        with Image.open(sample.image_path) as im:
            im = im.convert("RGB")
            ImageDraw.Draw(im).rectangle(sample.bbox_xyxy_px, outline="red", width=3)
            path = out_dir / f"{sample.id}.png"
            im.save(path)
        written.append(path)
    return written
