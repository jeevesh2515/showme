# Prices: SPIKES (a). Muse $/1M tokens (in, out); SAM $ per image.
GROUND_PRICES: dict[str, tuple[float, float]] = {
    "muse-spark-1.3": (1.25, 4.25),
    "muse-wonder-1.0": (4.00, 20.00),
}
SAM_COST_PER_IMAGE = 0.0025


def cost_ground(model: str, prompt_tokens: int, completion_tokens: int) -> float:
    price = GROUND_PRICES.get(model)
    if price is None:
        return 0.0
    return (prompt_tokens * price[0] + completion_tokens * price[1]) / 1_000_000


def cost_sam(images: int = 1) -> float:
    return SAM_COST_PER_IMAGE * images


# Admission bounds for spend reservations (API-6): a /v1/step call may run
# MAX_GENERATIONS generations (one unparsable retry), each capped at
# MAX_COMPLETION_TOKENS out; prompt is bounded by the 2560px image cap plus
# schema-bounded goal/history text. 8192 covers the largest prompt measured
# in eval (max single-call cost $0.031 on Wonder, eval/results/*/predictions.jsonl).
MAX_PROMPT_TOKENS = 8192
MAX_COMPLETION_TOKENS = 1024
MAX_GENERATIONS = 2


def max_step_cost(model: str) -> float:
    """Worst-case cost of one /v1/step request; reservations must cover this, not a typical call."""
    return MAX_GENERATIONS * cost_ground(model, MAX_PROMPT_TOKENS, MAX_COMPLETION_TOKENS)
