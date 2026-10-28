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


def summary(predictions: Sequence[dict[str, Any]]) -> dict[str, Any]:
    latencies = [
        p["latency_ms"] for p in predictions if p.get("latency_ms") is not None
    ]
    return {
        **_rate(predictions),
        "by_platform": breakdown(predictions, "platform"),
        "by_element_type": breakdown(predictions, "element_type"),
        "latency_p50_ms": percentile(latencies, 50),
        "latency_p95_ms": percentile(latencies, 95),
        "total_cost_usd": round(sum(p.get("cost_usd") or 0.0 for p in predictions), 4),
    }
