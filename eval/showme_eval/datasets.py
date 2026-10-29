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
    expected_status: str = ""  # negatives only: model must return this status (EVAL-6)


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


DEV_PARTITION_SIZE = 100


def select_partition(
    samples: Sequence[Sample], split: str, n: int | None = None, seed: int = 0
) -> list[Sample]:
    """Fixed partitions first, then limit INSIDE the partition (EVAL-9).

    Dev is always the first 100 of the seeded shuffle; held-out is the rest.
    Raising --n can never pull held-out samples into dev (review 2026-10-28 #4).
    """
    shuffled = _shuffled(samples, seed)
    partition = (
        shuffled[:DEV_PARTITION_SIZE]
        if split == "dev"
        else shuffled[DEV_PARTITION_SIZE:]
    )
    if n is None:
        return partition
    if n < 1 or n > len(partition):
        raise ValueError(f"--n {n} invalid for {split} partition of {len(partition)}")
    return partition[:n]


def stratified_sample(samples: Sequence[Sample], n: int, seed: int = 0) -> list[Sample]:
    """Proportional sample by (group x element_type), deterministic (EVAL-3)."""
    if not 1 <= n <= len(samples):
        raise ValueError(f"n {n} invalid for {len(samples)} samples")
    rng = random.Random(seed)
    strata: dict[tuple[str, str], list[Sample]] = {}
    for s in samples:
        strata.setdefault((s.group, s.element_type), []).append(s)
    # proportional allocation, largest remainder, at least 1 per non-empty stratum when n allows
    quotas: dict[tuple[str, str], float] = {
        k: n * len(v) / len(samples) for k, v in strata.items()
    }
    alloc = {
        k: max(1, int(q)) if n >= len(strata) else int(q) for k, q in quotas.items()
    }
    for k in sorted(quotas, key=lambda k: quotas[k] - int(quotas[k]), reverse=True):
        if sum(alloc.values()) >= n:
            break
        if alloc[k] < len(strata[k]):
            alloc[k] += 1
    while sum(alloc.values()) > n:  # trim largest over-allocated stratum
        k = max(alloc, key=lambda k: alloc[k] - quotas[k])
        alloc[k] -= 1
    out: list[Sample] = []
    for k in sorted(strata):
        pool = list(strata[k])
        rng.shuffle(pool)
        out.extend(pool[: alloc[k]])
    rng.shuffle(out)
    return out[:n]


def build_negatives(samples: Sequence[Sample], n: int, seed: int = 0) -> list[Sample]:
    """Pair each instruction with a screenshot from a different app/group (EVAL-6)."""
    rng = random.Random(seed)
    pool = list(samples)
    rng.shuffle(pool)
    out: list[Sample] = []
    for i, source in enumerate(pool):
        if len(out) >= n:
            break
        # deterministic partner: next sample in shuffled pool with a different image+group
        partner = next(
            (
                pool[(i + j) % len(pool)]
                for j in range(1, len(pool))
                if pool[(i + j) % len(pool)].image_path != source.image_path
                and pool[(i + j) % len(pool)].group != source.group
            ),
            None,
        )
        if partner is None:
            continue
        out.append(
            Sample(
                id=f"neg-{len(out)}",
                instruction=source.instruction,
                image_path=partner.image_path,
                bbox_xyxy_px=(0.0, 0.0, 0.0, 0.0),
                width=partner.width,
                height=partner.height,
                platform=partner.platform,
                element_type=partner.element_type,
                group=partner.group,
                expected_status="not_visible",
            )
        )
    return out


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
