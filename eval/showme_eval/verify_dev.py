"""Measure verifier lift (ARCH 5.5): dev split, or held-out from cached predictions.

Grounding comes from the response cache / predictions file ($0); verifier calls are live.
Usage: python -m showme_eval.verify_dev [--n 100] | --preds <predictions.jsonl>
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
from datetime import date
from pathlib import Path

from .datasets import load_v2_local, select_partition
from .report import update_spend
from .runner import preprocess, run

EVAL_ROOT = Path(__file__).resolve().parents[1]
EST_COST_PER_VERIFY = 0.002  # estimate: small crop, minimal effort (ARCH 5.5)


async def _verdicts(ok: list[dict], by_id: dict, settings) -> list[dict]:
    from showme.core.verifier import crop_for_verify, verify

    semaphore = asyncio.Semaphore(8)

    async def check(p: dict) -> dict:
        async with semaphore:
            sample = by_id[p["sample_id"]]
            image_url, w, h = preprocess(sample.image_path)
            if p.get("image_width") and (w, h) != (p["image_width"], p["image_height"]):
                raise ValueError(
                    "processed size mismatch: predictions were made at a different scale"
                )
            crop = crop_for_verify(image_url, tuple(int(v) for v in p["box"]), w, h)  # type: ignore[arg-type]
            verdict = await verify(
                crop,
                str(p["response"].get("target_label", "")),
                sample.instruction,
                settings,
            )
            return {**p, "verifier": verdict}

    return list(await asyncio.gather(*(check(p) for p in ok)))


async def _measure(args: argparse.Namespace) -> dict:
    from showme.core.settings import Settings

    settings = Settings(
        api_key=os.environ.get("MODEL_API_KEY", ""),
        base_url=os.environ.get("META_BASE_URL", "https://api.meta.ai/v1"),
    )
    all_v2 = load_v2_local(EVAL_ROOT / "data" / "screenspot-v2")
    if args.preds:
        preds = [json.loads(line) for line in Path(args.preds).read_text().splitlines()]
        samples = select_partition(all_v2, "heldout", seed=0)
        split = "heldout-cached"
    else:
        samples = select_partition(all_v2, "dev", n=args.n, seed=0)
        preds = await run(
            samples, settings, split="dev", cache_dir=EVAL_ROOT / "results" / "cache"
        )
        split = "dev"
    by_id = {s.id: s for s in samples}
    ok = [
        p
        for p in preds
        if p.get("status") == "ok" and p.get("box") and p.get("response")
    ]
    checked_rows = await _verdicts(ok, by_id, settings)
    kept = [p for p in checked_rows if p["verifier"] is not False]
    checked = sum(1 for p in checked_rows if p["verifier"] is not None)
    return {
        "date": date.today().isoformat(),
        "split": split,
        "n_ok": len(ok),
        "verifier_checked": checked,
        "precision_before": (sum(1 for p in ok if p["hit"]) / len(ok)) if ok else None,
        "precision_after": (sum(1 for p in kept if p["hit"]) / len(kept))
        if kept
        else None,
        "kept": len(kept),
        "est_cost_usd": round(checked * EST_COST_PER_VERIFY, 4),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="showme-verify-dev")
    parser.add_argument("--n", type=int, default=100)
    parser.add_argument(
        "--preds", type=Path, default=None, help="held-out predictions.jsonl"
    )
    args = parser.parse_args(argv)
    if not os.environ.get("MODEL_API_KEY"):
        print("MODEL_API_KEY is not set; nothing was run")
        return 2
    result = asyncio.run(_measure(args))
    out = EVAL_ROOT / "results" / f"{result['date']}-verifier-{result['split']}"
    out.mkdir(parents=True, exist_ok=True)
    (out / "summary.json").write_text(json.dumps(result, indent=2))
    update_spend(
        EVAL_ROOT / "results", result["est_cost_usd"], label=f"{out.name} (estimate)"
    )
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
