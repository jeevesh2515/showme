"""PRIV-7 / FLOW-2 parity: the browser patterns.ts and the backend pii.py must agree.

The corpus is one JSON file read by both sides, so a change to either implementation
that changes behaviour fails here or in the matching vitest file.
"""

import json
from pathlib import Path
from typing import Any

import pytest

from showme.core.pii import contains_pii, mask_pii

_VECTOR_PATH = Path(__file__).resolve().parents[2] / "apps/web/lib/redaction/pii-vectors.json"
_VECTORS: list[dict[str, Any]] = json.loads(_VECTOR_PATH.read_text())["vectors"]


@pytest.mark.parametrize("vector", _VECTORS, ids=[str(v["id"]) for v in _VECTORS])
def test_priv_7_shared_vectors_match_python(vector: dict[str, Any]) -> None:
    assert contains_pii(str(vector["text"])) is vector["shouldMatch"], vector["text"]


def test_priv_7_shared_corpus_recall_at_least_95() -> None:
    positives = [v for v in _VECTORS if v["shouldMatch"]]
    found = [v for v in positives if contains_pii(str(v["text"]))]
    assert len(found) / len(positives) >= 0.95, f"{len(found)}/{len(positives)}"


def test_priv_7_shared_vectors_positives_are_masked() -> None:
    for vector in _VECTORS:
        if vector["shouldMatch"]:
            assert "[hidden]" in mask_pii(str(vector["text"])), vector["id"]


def test_priv_7_mask_uses_hidden_placeholder() -> None:
    assert mask_pii("Email jane.doe@example.com about card 4111 1111 1111 1111") == "Email [hidden] about card [hidden]"
    assert mask_pii("call +44 7700 900123") == "call [hidden]"
    assert mask_pii("nothing private here") == "nothing private here"


def test_priv_7_overlapping_matches_merged_completely() -> None:
    # Review 2026-10-29 #1: card with digit run must not expose suffixes
    assert mask_pii("41111111-1111-1111") == "[hidden]"
    assert "1111" not in mask_pii("41111111-1111-1111")
    assert mask_pii("user 12345678@example.com end") == "user [hidden] end"
