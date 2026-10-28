import asyncio

import pytest
from showme_eval.cache import Cache, cache_key
from showme_eval.runner import run

KEY_ARGS = {
    "model": "muse-spark-1.3",
    "effort": "minimal",
    "prompt_version": "v1",
    "image_sha256": "abc",
    "instruction": "cancel my subscription",
    "sam_on": False,
}


def test_eval_5_cache_key_changes_with_effort_and_sam():
    base = cache_key(**KEY_ARGS)
    assert base != cache_key(**{**KEY_ARGS, "effort": "medium"})
    assert base != cache_key(**{**KEY_ARGS, "sam_on": True})
    assert base != cache_key(**{**KEY_ARGS, "instruction": "delete my account"})
    assert base == cache_key(**KEY_ARGS)


def test_cache_roundtrip(tmp_path):
    cache = Cache(tmp_path)
    assert cache.get("missing") is None
    cache.put("k", {"response": {"status": "ok"}, "latency_ms": 12})
    assert cache.get("k")["latency_ms"] == 12


def test_eval_9_dev_split_cannot_be_headline():
    with pytest.raises(ValueError, match="EVAL-9"):
        asyncio.run(run([], None, split="dev", headline=True))


def test_eval_9_cli_refuses_dev_headline():
    from showme_eval.cli import main

    assert main(["--suite", "screenspot-v2", "--split", "dev", "--headline"]) == 2
