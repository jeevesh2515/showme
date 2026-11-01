"""EVAL-8: the E2E harness step reserve must cover the backend's worst-case step + refine cost."""

import re
from pathlib import Path

from showme.core.pricing import SAM_COST_PER_IMAGE, max_step_cost

BUDGET_MJS = Path(__file__).resolve().parents[1] / "e2e" / "budget.mjs"


def test_eval_8_step_reserve_covers_pricing_worst_case() -> None:
    match = re.search(
        r"export const STEP_RESERVE_USD = ([0-9.]+);", BUDGET_MJS.read_text()
    )
    assert match, "STEP_RESERVE_USD not found in budget.mjs"
    # The web app never escalates, so production grounding is muse-spark-1.3.
    assert float(match.group(1)) >= max_step_cost("muse-spark-1.3") + SAM_COST_PER_IMAGE
