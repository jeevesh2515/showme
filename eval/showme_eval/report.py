"""Write run artefacts and keep eval/results/spend.json current."""

from __future__ import annotations

import json
import subprocess
from collections.abc import Sequence
from datetime import date
from pathlib import Path
from typing import Any

from .metrics import summary as score


def git_sha(cwd: Path) -> str:
    try:
        return subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def _markdown(result: dict[str, Any]) -> str:
    lines = [
        f"# {result['suite']} · {result['model']} · {result['effort']} · SAM {'on' if result['sam_on'] else 'off'}",
        "",
        f"- Date: {result['date']}",
        f"- Split: **{result['split']}**"
        + (" (headline)" if result["is_headline"] else ""),
        f"- Accuracy: **{result['hits']}/{result['n']} = {result['accuracy']:.1%}**",
        f"- Latency p50/p95: {result['latency_p50_ms']} / {result['latency_p95_ms']} ms",
        f"- Cost: ${result['total_cost_usd']:.4f}",
        f"- Prompt version: {result['prompt_version']} · git {result['git_sha']}",
        f"- Preprocessing: production path (RGB, long side <= {result.get('max_side', 2560)}, JPEG q=0.85); images are public benchmarks, not redacted.",
        "",
        "## By platform",
        "",
        "| platform | n | hits | accuracy |",
        "| --- | --- | --- | --- |",
    ]
    for name, row in result["by_platform"].items():
        lines.append(f"| {name} | {row['n']} | {row['hits']} | {row['accuracy']:.1%} |")
    lines += [
        "",
        "## By element type",
        "",
        "| type | n | hits | accuracy |",
        "| --- | --- | --- | --- |",
    ]
    for name, row in result["by_element_type"].items():
        lines.append(f"| {name} | {row['n']} | {row['hits']} | {row['accuracy']:.1%} |")
    if result["split"] == "dev":
        lines += [
            "",
            "> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).",
        ]
    lines += [
        "",
        f"Raw predictions: `predictions.jsonl` ({result['n']} rows, EVAL-7).",
        "",
    ]
    return "\n".join(lines)


def write_run(
    out_dir: Path, predictions: Sequence[dict[str, Any]], meta: dict[str, Any]
) -> dict:
    out_dir = Path(out_dir)
    if (out_dir / "predictions.jsonl").exists():
        raise FileExistsError(
            f"run artefacts are immutable, refusing to overwrite: {out_dir}"
        )
    out_dir.mkdir(parents=True, exist_ok=True)
    result = {
        **meta,
        **score(predictions),
        "prompt_version": meta.get("prompt_version")
        or (predictions[0].get("prompt_version") if predictions else "unknown"),
        "date": meta.get("date") or date.today().isoformat(),
        "git_sha": meta.get("git_sha") or git_sha(out_dir),
    }
    (out_dir / "predictions.jsonl").write_text(
        "".join(json.dumps(p) + "\n" for p in predictions)
    )
    (out_dir / "summary.json").write_text(json.dumps(result, indent=2))
    (out_dir / "report.md").write_text(_markdown(result))
    return result


def update_spend(results_dir: Path, cost_usd: float, label: str = "") -> dict[str, Any]:
    path = Path(results_dir) / "spend.json"
    data = (
        json.loads(path.read_text()) if path.exists() else {"total_usd": 0, "runs": []}
    )
    data["total_usd"] = round(data["total_usd"] + cost_usd, 4)
    data["runs"].append(
        {
            "date": date.today().isoformat(),
            "label": label,
            "cost_usd": round(cost_usd, 4),
        }
    )
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2))
    return data
