"""python -m showme_eval --suite screenspot-v2 --split dev --n 100"""

from __future__ import annotations

import argparse
import asyncio
import os
import sys
from datetime import date
from pathlib import Path
from types import SimpleNamespace

from .datasets import dev_split, heldout_split, load_pro_local, load_v2_local
from .report import update_spend, write_run
from .runner import run

EVAL_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = EVAL_ROOT / "data"
RESULTS_ROOT = EVAL_ROOT / "results"


def _settings(model: str, effort: str) -> object:
    values = {
        "api_key": os.environ.get("MODEL_API_KEY", ""),
        "base_url": os.environ.get("META_BASE_URL", "https://api.meta.ai/v1"),
        "model": model,
        "effort": effort,
        "escalation_model": "muse-wonder-1.0",
    }
    try:
        from showme.core.settings import Settings

        return Settings(**values)
    except ImportError:
        return SimpleNamespace(**values)


def _parse(argv: list[str] | None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(prog="showme-eval")
    parser.add_argument(
        "--suite", choices=["screenspot-v2", "screenspot-pro"], required=True
    )
    parser.add_argument("--split", choices=["dev", "heldout"], default="heldout")
    parser.add_argument("--n", type=int, default=None)
    parser.add_argument("--model", default="muse-spark-1.3")
    parser.add_argument("--effort", default="minimal")
    parser.add_argument("--sam", choices=["on", "off"], default="off")
    parser.add_argument("--headline", action="store_true")
    parser.add_argument(
        "--max-side",
        type=int,
        default=2560,
        help="preprocess long-side cap; 0 = native (A7)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse(argv)
    if args.headline and args.split == "dev":
        print(
            "EVAL-9: a dev-split run cannot be headline; nothing was run",
            file=sys.stderr,
        )
        return 2
    data_dir = DATA_ROOT / args.suite
    try:
        if args.suite == "screenspot-v2":
            samples = load_v2_local(data_dir)
            samples = (
                dev_split(samples, seed=0, n=args.n or 100)
                if args.split == "dev"
                else heldout_split(samples, seed=0)[: args.n]
            )
        else:
            samples = load_pro_local(data_dir)
            samples = samples[: args.n]
    except FileNotFoundError as exc:
        print(
            f"dataset not available: {exc}\nSee eval/README.md to fetch it. Nothing was run.",
            file=sys.stderr,
        )
        return 2

    if not samples:
        print("no samples selected; nothing was run", file=sys.stderr)
        return 2
    if not os.environ.get("MODEL_API_KEY"):
        print(
            "MODEL_API_KEY is not set (load .env first); nothing was run",
            file=sys.stderr,
        )
        return 2

    sam_on = args.sam == "on"
    max_side = args.max_side if args.max_side > 0 else 100_000
    config = (
        f"{args.model}-{args.effort}-sam{'on' if sam_on else 'off'}-max{args.max_side}"
    )
    out_dir = RESULTS_ROOT / f"{date.today().isoformat()}-{args.suite}-{config}"
    cache_dir = (
        RESULTS_ROOT / "cache"
    )  # shared: unchanged config reruns cost $0 (ARCH §13)

    print(
        f"{len(samples)} samples · {args.model} · {args.effort} · SAM {'on' if sam_on else 'off'}"
    )
    predictions = asyncio.run(
        run(
            samples,
            _settings(args.model, args.effort),
            sam_on=sam_on,
            split=args.split,
            headline=args.headline,
            cache_dir=cache_dir,
            max_side=max_side,
        )
    )
    meta = {
        "suite": args.suite,
        "model": args.model,
        "effort": args.effort,
        "sam_on": sam_on,
        "max_side": args.max_side,
        "split": args.split,
        "is_headline": args.headline and args.split != "dev",
    }
    result = write_run(out_dir, predictions, meta)
    update_spend(RESULTS_ROOT, result["total_cost_usd"], label=out_dir.name)
    print(
        f"{result['hits']}/{result['n']} = {result['accuracy']:.1%} · ${result['total_cost_usd']:.4f}"
    )
    print(f"wrote {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
