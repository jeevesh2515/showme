"""Run production SAM refine on stored e2e boxes, so outline and box can be compared on one step.
Live and paid: at most MAX_CALLS x $0.0025. Resumes from pairs.jsonl, so a re-run never pays twice."""

import asyncio
import base64
import hashlib
import json
import os
from pathlib import Path

from showme.core.sam import refine
from showme.core.schema import BoxPx, PointPx
from showme.core.settings import Settings
from showme_eval.report import update_spend

HERE = Path(__file__).parent
RESULTS = HERE.parent / "results"
RUN = RESULTS / "2026-11-02-e2e-bb543ba-04574992c7"
OUT = HERE / "pairs.jsonl"
SEED = "showme-rating-2026-11-02"
WANT = 20
MAX_CALLS = 40


def ordered_steps() -> list[dict]:
    steps = [
        json.loads(line)
        for f in sorted((RUN / "trail").glob("*/steps.jsonl"))
        for line in f.read_text().splitlines()
        if line
    ]
    steps = [s for s in steps if (s.get("response") or {}).get("target")]
    key = lambda s: hashlib.sha256(
        f"{SEED}:{s['task']}:{s['step']}".encode()
    ).hexdigest()
    return sorted(steps, key=key)


async def main() -> None:
    done = (
        [json.loads(line) for line in OUT.read_text().splitlines()]
        if OUT.exists()
        else []
    )
    seen = {(d["task"], d["step"]) for d in done}
    outlines = sum(d["refine"]["mode"] == "outline" for d in done)
    settings = Settings(
        api_key=os.environ["MODEL_API_KEY"],
        base_url=os.environ.get("META_BASE_URL", "https://api.meta.ai/v1"),
    )
    spent = 0.0
    calls = len(done)
    try:
        for s in ordered_steps():
            if outlines >= WANT or calls >= MAX_CALLS:
                break
            if (s["task"], s["step"]) in seen:
                continue
            jpg = (RUN / "trail" / s["task"] / f"step-{s['step']}.jpg").read_bytes()
            target = s["response"]["target"]
            result = await refine(
                "data:image/jpeg;base64," + base64.b64encode(jpg).decode(),
                BoxPx(**target["box"]),
                PointPx(**target["point"]),
                settings,
            )
            calls += 1
            spent += result.cost_usd
            outlines += result.mode == "outline"
            row = {
                "task": s["task"],
                "step": s["step"],
                "refine": result.model_dump(mode="json"),
            }
            with OUT.open("a") as f:
                f.write(json.dumps(row) + "\n")
    finally:
        if spent:
            update_spend(RESULTS, spent, "highlight-rating-refine-pairs")
    print(f"calls {calls}, outlines {outlines}, spent this run ${spent:.4f}")


if __name__ == "__main__":
    asyncio.run(main())
