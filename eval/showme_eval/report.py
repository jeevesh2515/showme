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
    lines += [
        "",
        "## By group",
        "",
        "| group | n | hits | accuracy |",
        "| --- | --- | --- | --- |",
    ]
    for name, row in result.get("by_group", {}).items():
        lines.append(f"| {name} | {row['n']} | {row['hits']} | {row['accuracy']:.1%} |")
    lines += [
        "",
        "## By status",
        "",
        "| status | n | hits | accuracy |",
        "| --- | --- | --- | --- |",
    ]
    for name, row in result.get("by_status", {}).items():
        lines.append(f"| {name} | {row['n']} | {row['hits']} | {row['accuracy']:.1%} |")
    if result["split"] == "dev":
        lines += [
            "",
            "> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).",
        ]
    if (
        result.get("suite") == "negatives"
    ):  # EVAL-6: never pool easy synthetic probes into headline honesty
        groups = result.get("by_group", {})
        plain = [r for k, r in groups.items() if not k.startswith("synthetic")]
        n_plain = sum(r["n"] for r in plain)
        hits_plain = sum(r["hits"] for r in plain)
        lines += [
            "",
            "## Honesty breakdown (EVAL-6)",
            "",
            f"- Absent-target pairs: {hits_plain}/{n_plain} = {(hits_plain / n_plain if n_plain else 0):.1%} strict `not_visible` (ARCH section 13).",
            f"- Prompt-injection probes: {groups.get('synthetic-injection', {}).get('hits', 0)}/{groups.get('synthetic-injection', {}).get('n', 0)} not followed.",
            f"- Harmful-goal probes: {groups.get('synthetic-harmful', {}).get('hits', 0)}/{groups.get('synthetic-harmful', {}).get('n', 0)} refused.",
            f"- PRIV-10 probes: {groups.get('synthetic-priv10', {}).get('hits', 0)}/{groups.get('synthetic-priv10', {}).get('n', 0)} refused.",
            "",
        ]
    if result.get("sam_ablation"):
        s = result["sam_ablation"]
        lines += [
            "",
            "## SAM ablation (EVAL-4)",
            "",
            f"- Gate pass: {s['gate_pass']}/{s['n_with_box']} = {s['gate_pass_rate']:.1%}; box fallback for the rest.",
            f"- Mean IoU model box: {s['mean_iou_model']:.3f}; SAM agreement-gated: {(s['mean_iou_sam_gated'] or 0):.3f}",
            f"- SAM IoU better than model box on {s['sam_better_count']} gated samples.",
            "- Click accuracy above is unchanged by SAM by design: SAM never moves the click point.",
            "",
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


def write_results_md(results_dir: Path) -> Path:
    """Regenerate RESULTS.md from run summaries; never hand-edit it (RULES section 2)."""
    results_dir = Path(results_dir)
    lines = [
        "# Results (generated from summary.json files; do not hand-edit)",
        "",
        "| date | suite | split | model | effort | n | accuracy | predictions |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for summary_path in sorted(results_dir.glob("*/summary.json")):
        r = json.loads(summary_path.read_text())
        if not r.get("suite"):
            continue  # verifier/calibration summaries are linked below, not benchmark rows
        lines.append(
            f"| {r.get('date', '')} | {r.get('suite', '')} | {r.get('split', '')} "
            f"| {r.get('model', '')} | {r.get('effort', '')} | {r.get('n', '')} "
            f"| {r.get('accuracy', 0):.1%} | `{summary_path.parent.name}/predictions.jsonl` |"
        )
    lines += ["", "## Calibration and verifier (generated)", ""]
    for cal in sorted(results_dir.glob("*/calibration.json")):
        r = json.loads(cal.read_text())
        lines.append(
            f"- AUROC {r.get('auroc')}, tau {r.get('tau_at_95pct_precision')}: `{cal.parent.name}/calibration.md`"
        )
    for ver in sorted(results_dir.glob("*verifier*/summary.json")):
        r = json.loads(ver.read_text())
        lines.append(
            f"- Verifier ({r.get('split')}): precision {r.get('precision_before')} -> {r.get('precision_after')}, "
            f"kept {r.get('kept')}/{r.get('n_ok')}: `{ver.parent.name}/summary.json`"
        )
    out = results_dir / "RESULTS.md"
    out.write_text("\n".join(lines) + "\n")
    return out


def update_spend(results_dir: Path, cost_usd: float, label: str = "") -> dict[str, Any]:
    import fcntl
    import os

    path = Path(results_dir) / "spend.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path.parent / ".spend.lock", "w") as lock:  # serialise concurrent runs
        fcntl.flock(lock, fcntl.LOCK_EX)
        data = (
            json.loads(path.read_text())
            if path.exists()
            else {"total_usd": 0, "runs": []}
        )
        data["total_usd"] = round(data["total_usd"] + cost_usd, 4)
        data["runs"].append(
            {
                "date": date.today().isoformat(),
                "label": label,
                "cost_usd": round(cost_usd, 4),
            }
        )
        tmp = path.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(data, indent=2))
        os.replace(tmp, path)
        fcntl.flock(lock, fcntl.LOCK_UN)
    return data
