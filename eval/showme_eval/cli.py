"""python -m showme_eval --suite screenspot-v2 --split dev --n 100"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import os
import sys
import uuid
from datetime import date
from pathlib import Path
from types import SimpleNamespace

from .datasets import (
    build_negatives,
    load_pro_local,
    load_v2_local,
    select_partition,
    stratified_sample,
)
from .negatives import ensure_fixtures
from .report import update_spend, write_results_md, write_run
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
        "--suite",
        choices=["screenspot-v2", "screenspot-pro", "negatives"],
        required=True,
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
    parser.add_argument("--concurrency", type=int, default=8)
    return parser.parse_args(argv)


def sample_set_hash(sample_ids: list[str]) -> str:
    return hashlib.sha256(",".join(sample_ids).encode()).hexdigest()[:8]


def build_run_dir(
    results_root: Path,
    *,
    date_str: str,
    suite: str,
    split: str,
    sample_ids: list[str],
    model: str,
    effort: str,
    sam_on: bool,
    max_side: int,
    prompt_version: str,
    run_id: str,
) -> Path:
    """Immutable run identity: split + sample set + config + prompt + run id (review 2026-10-28 #2)."""
    name = (
        f"{date_str}-{suite}-{split}-n{len(sample_ids)}-{sample_set_hash(sample_ids)}"
        f"-{model}-{effort}-sam{'on' if sam_on else 'off'}-max{max_side}-pv{prompt_version}-{run_id}"
    )
    return results_root / name


def _prompt_version() -> str:
    try:
        from showme.core.prompts import PROMPT_VERSION

        return PROMPT_VERSION
    except ImportError:
        return "unknown"


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
            samples = select_partition(
                load_v2_local(data_dir), args.split, n=args.n, seed=0
            )
        elif args.suite == "negatives":
            v2 = load_v2_local(DATA_ROOT / "screenspot-v2")
            samples = build_negatives(v2, 200, seed=0) + ensure_fixtures(
                DATA_ROOT / "negatives"
            )
            if args.n is not None:
                samples = samples[: args.n]
        else:
            all_pro = load_pro_local(data_dir)
            samples = stratified_sample(all_pro, args.n or 300, seed=0)
    except FileNotFoundError as exc:
        print(
            f"dataset not available: {exc}\nSee eval/README.md to fetch it. Nothing was run.",
            file=sys.stderr,
        )
        return 2
    except ValueError as exc:
        print(f"invalid sample selection: {exc}; nothing was run", file=sys.stderr)
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
    out_dir = build_run_dir(
        RESULTS_ROOT,
        date_str=date.today().isoformat(),
        suite=args.suite,
        split=args.split,
        sample_ids=[s.id for s in samples],
        model=args.model,
        effort=args.effort,
        sam_on=sam_on,
        max_side=args.max_side,
        prompt_version=_prompt_version(),
        run_id=uuid.uuid4().hex[:8],
    )
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
            concurrency=args.concurrency,
        )
    )
    meta = {
        "suite": args.suite,
        "model": args.model,
        "effort": args.effort,
        "sam_on": sam_on,
        "max_side": args.max_side if args.max_side > 0 else 100000,
        "split": args.split if args.suite == "screenspot-v2" else "heldout",
        "is_headline": args.headline and args.split != "dev",
    }
    result = write_run(out_dir, predictions, meta)
    update_spend(RESULTS_ROOT, result["total_cost_usd"], label=out_dir.name)
    write_results_md(RESULTS_ROOT)
    print(
        f"{result['hits']}/{result['n']} = {result['accuracy']:.1%} · ${result['total_cost_usd']:.4f}"
    )
    print(f"wrote {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
