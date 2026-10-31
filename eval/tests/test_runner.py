"""EVAL-2: runner drives the real showme.core postprocess; only the HTTP call is faked."""

import asyncio

from PIL import Image
from showme_eval.datasets import Sample
from showme_eval.runner import run

RAW = {
    "status": "ok",
    "action": "tap",
    "instruction": "Tap the weather icon, top left.",
    "target_label": "Weather",
    "point": {"x": 500, "y": 500},
    "bbox": {"x_min": 400, "y_min": 400, "x_max": 600, "y_max": 600},
    "scroll_direction": "none",
    "type_text": "",
    "confidence": 0.95,
    "caution": "",
    "reason": "icon is visible",
}


def test_eval_2_runner_scores_against_ground_truth(tmp_path, monkeypatch):
    from showme.core import grounding
    from showme.core.schema import ModelOutput
    from showme.core.settings import Settings

    path = tmp_path / "screen.png"
    Image.new("RGB", (1000, 1000), "white").save(path)
    sample = Sample(
        "s1",
        "check the weather",
        path,
        (400.0, 400.0, 700.0, 700.0),
        1000,
        1000,
        "ios",
        "icon",
    )

    async def fake_ground(image_data_url, goal, history, settings):
        return (
            ModelOutput.model_validate(RAW),
            {"prompt_tokens": 1000, "completion_tokens": 100},
            42,
        )

    monkeypatch.setattr(grounding, "ground", fake_ground)

    [prediction] = asyncio.run(run([sample], Settings(), cache_dir=tmp_path / "cache"))

    assert prediction["hit"] is True
    assert prediction["point"] == [500.0, 500.0]
    assert prediction["box"] == [400.0, 400.0, 600.0, 600.0]
    assert prediction["status"] == "ok"
    assert prediction["cost_usd"] > 0
    from showme.core.prompts import PROMPT_VERSION

    assert prediction["prompt_version"] == PROMPT_VERSION


def test_runner_reuses_cache_without_calling_model(tmp_path, monkeypatch):
    from showme.core import grounding
    from showme.core.schema import ModelOutput
    from showme.core.settings import Settings

    path = tmp_path / "screen.png"
    Image.new("RGB", (400, 400), "white").save(path)
    sample = Sample(
        "s1", "goal", path, (0.0, 0.0, 400.0, 400.0), 400, 400, "web", "text"
    )
    calls = []

    async def fake_ground(image_data_url, goal, history, settings):
        calls.append(1)
        return ModelOutput.model_validate(RAW), {}, 10

    monkeypatch.setattr(grounding, "ground", fake_ground)
    settings = Settings()

    first = asyncio.run(run([sample], settings, cache_dir=tmp_path / "cache"))
    second = asyncio.run(run([sample], settings, cache_dir=tmp_path / "cache"))

    assert len(calls) == 1
    assert first[0]["hit"] == second[0]["hit"]
