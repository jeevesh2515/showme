"""Scoring: click accuracy (point inside GT box), breakdowns, latency percentiles."""

from __future__ import annotations

from collections.abc import Sequence
from typing import Any


def point_in_box(point: Sequence[float], box: Sequence[float]) -> bool:
    x, y = point[0], point[1]
    x1, y1, x2, y2 = box
    return x1 <= x <= x2 and y1 <= y <= y2


def percentile(values: Sequence[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = (len(ordered) - 1) * q / 100
    lo, hi = int(index), min(int(index) + 1, len(ordered) - 1)
    return ordered[lo] + (ordered[hi] - ordered[lo]) * (index - lo)


def _rate(predictions: Sequence[dict[str, Any]]) -> dict[str, Any]:
    n = len(predictions)
    hits = sum(1 for p in predictions if p.get("hit"))
    return {"n": n, "hits": hits, "accuracy": hits / n if n else 0.0}


def breakdown(
    predictions: Sequence[dict[str, Any]], key: str
) -> dict[str, dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = {}
    for prediction in predictions:
        groups.setdefault(str(prediction.get(key, "")), []).append(prediction)
    return {name: _rate(rows) for name, rows in sorted(groups.items())}


def iou(a: Sequence[float], b: Sequence[float]) -> float:
    ix1, iy1 = max(a[0], b[0]), max(a[1], b[1])
    ix2, iy2 = min(a[2], b[2]), min(a[3], b[3])
    inter = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union else 0.0


def auroc(pairs: Sequence[tuple[float, bool]]) -> float | None:
    """AUROC of confidence for hit vs miss, tie-aware (Mann-Whitney)."""
    pos = [c for c, hit in pairs if hit]
    neg = [c for c, hit in pairs if not hit]
    if not pos or not neg:
        return None
    wins = sum(1.0 if p > n else 0.5 if p == n else 0.0 for p in pos for n in neg)
    return wins / (len(pos) * len(neg))


def _conf(p: dict[str, Any]) -> float:
    return min(max(float(p["confidence"]), 0.0), 1.0)  # pre-clamp runs stored >1 / 95.0


def reliability_bins(
    predictions: Sequence[dict[str, Any]], n_bins: int = 10
) -> list[dict[str, Any]]:
    bins: list[list[dict[str, Any]]] = [[] for _ in range(n_bins)]
    for p in predictions:
        conf = p.get("confidence")
        if conf is None:
            continue
        bins[min(int(_conf(p) * n_bins), n_bins - 1)].append(p)
    out = []
    for i, rows in enumerate(bins):
        if not rows:
            continue
        out.append(
            {
                "bin": f"{i / n_bins:.1f}-{(i + 1) / n_bins:.1f}",
                "n": len(rows),
                "mean_confidence": sum(_conf(r) for r in rows) / len(rows),
                "accuracy": sum(1 for r in rows if r.get("hit")) / len(rows),
            }
        )
    return out


def choose_tau(
    predictions: Sequence[dict[str, Any]], target_precision: float = 0.95
) -> float | None:
    """ARCH 5.5 pre-registered: smallest tau with >= target precision on raw `ok` steps, else None."""
    ok = [
        p
        for p in predictions
        if p.get("raw_status") == "ok" and p.get("confidence") is not None
    ]
    for tau in sorted({_conf(p) for p in ok}):
        kept = [p for p in ok if _conf(p) >= tau]
        if (
            kept
            and sum(1 for p in kept if p.get("hit")) / len(kept) >= target_precision
        ):
            return tau
    return None


def summary(predictions: Sequence[dict[str, Any]]) -> dict[str, Any]:
    latencies = [
        p["latency_ms"] for p in predictions if p.get("latency_ms") is not None
    ]
    result: dict[str, Any] = {
        **_rate(predictions),
        "by_platform": breakdown(predictions, "platform"),
        "by_element_type": breakdown(predictions, "element_type"),
        "by_group": breakdown(predictions, "group"),
        "by_status": breakdown(predictions, "status"),
        "by_expected_status": breakdown(predictions, "expected_status"),
        "latency_p50_ms": percentile(latencies, 50),
        "latency_p95_ms": percentile(latencies, 95),
        "total_cost_usd": round(sum(p.get("cost_usd") or 0.0 for p in predictions), 4),
    }
    with_box = [p for p in predictions if p.get("iou_model") is not None]
    if with_box:  # EVAL-4 SAM ablation; click accuracy is the headline above and never moves with SAM
        gated = [p for p in with_box if p.get("gate_pass")]
        result["sam_ablation"] = {
            "n_with_box": len(with_box),
            "gate_pass": len(gated),
            "gate_pass_rate": len(gated) / len(with_box),
            "mean_iou_model": sum(p["iou_model"] for p in with_box) / len(with_box),
            "mean_iou_sam_gated": (
                sum(p["iou_sam"] for p in gated) / len(gated) if gated else None
            ),
            "sam_better_count": sum(
                1 for p in gated if (p.get("iou_sam") or 0) > p["iou_model"]
            ),
        }
    return result
