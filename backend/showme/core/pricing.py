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
