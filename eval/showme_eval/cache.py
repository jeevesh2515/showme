"""Response cache: one JSON file per (model, effort, prompt_version, image, instruction, sam) key."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def cache_key(
    model: str,
    effort: str,
    prompt_version: str,
    image_sha256: str,
    instruction: str,
    sam_on: bool,
) -> str:
    blob = json.dumps(
        [model, effort, prompt_version, image_sha256, instruction, bool(sam_on)],
        separators=(",", ":"),
    )
    return hashlib.sha256(blob.encode()).hexdigest()


class Cache:
    def __init__(self, directory: Path | str) -> None:
        self.directory = Path(directory)

    def get(self, key: str) -> Any | None:
        path = self.directory / f"{key}.json"
        if not path.exists():
            return None
        try:
            return json.loads(path.read_text())
        except (OSError, json.JSONDecodeError):
            return None  # torn write from a killed run: treat as a miss, never kill the run

    def put(self, key: str, value: Any) -> None:
        self.directory.mkdir(parents=True, exist_ok=True)
        tmp = self.directory / f"{key}.json.tmp"
        tmp.write_text(json.dumps(value))
        tmp.replace(self.directory / f"{key}.json")  # atomic: no torn cache files
