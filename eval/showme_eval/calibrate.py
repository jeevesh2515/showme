"""Calibration from generated predictions.jsonl files (EVAL-6). Never hand-edit outputs.

Usage: python -m showme_eval.calibrate <run-dir> [<run-dir> ...] --out <dir>
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .metrics import auroc, choose_tau, reliability_bins


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="showme-calibrate")
    parser.add_argument("runs", nargs="+", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    args = parser.parse_args(argv)

    predictions = []
    for run in args.runs:
        predictions += [
            json.loads(line)
            for line in (run / "predictions.jsonl").read_text().splitlines()
        ]
    scored = [
        p
        for p in predictions
        if p.get("confidence") is not None and not p.get("expected_status")
    ]
    pairs = [
        (min(max(float(p["confidence"]), 0.0), 1.0), bool(p["hit"])) for p in scored
    ]  # pre-clamp artefacts stored >1
    ok = [p for p in scored if p.get("raw_status") == "ok"]
    tau = choose_tau(scored)
    kept = [p for p in ok if tau is not None and float(p["confidence"]) >= tau]
    result = {
        "n": len(scored),
        "auroc": auroc(pairs),
        "reliability_bins": reliability_bins(scored),
        "tau_at_95pct_precision": tau,
        "ok_before": len(ok),
        "ok_after_tau": len(kept),
        "precision_ok_after_tau": (sum(1 for p in kept if p["hit"]) / len(kept))
        if kept
        else None,
        "runs": [str(r) for r in args.runs],
    }
    args.out.mkdir(parents=True, exist_ok=True)
    (args.out / "calibration.json").write_text(json.dumps(result, indent=2))
    lines = [
        "# Calibration (generated, do not hand-edit)",
        "",
        f"- n scored: {result['n']}",
        f"- Confidence AUROC (hit vs miss): {result['auroc']}",
        f"- tau at >=95% precision on ok steps: {result['tau_at_95pct_precision']}",
        f"- ok steps before/after tau: {result['ok_before']} / {result['ok_after_tau']}",
        f"- precision on ok after tau: {result['precision_ok_after_tau']}",
        "",
        "| bin | n | mean confidence | accuracy |",
        "| --- | --- | --- | --- |",
    ]
    for b in result["reliability_bins"]:
        lines.append(
            f"| {b['bin']} | {b['n']} | {b['mean_confidence']:.2f} | {b['accuracy']:.1%} |"
        )
    (args.out / "calibration.md").write_text("\n".join(lines) + "\n")
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
