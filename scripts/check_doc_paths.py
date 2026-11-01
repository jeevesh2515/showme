#!/usr/bin/env python3
"""Fail when key docs cite repo paths that do not exist. Stdlib only.

Scans markdown links `[text](path)` and backticked paths (contain `/` and an
extension, or end with `/`). Strips `#anchor` and `:line` suffixes; ignores URLs.

Usage: python3 scripts/check_doc_paths.py   (exit 1 lists every missing path)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ["README.md", "docs/SUBMISSION.md", "docs/REQUIREMENTS_STATUS.md"]
LINK = re.compile(r"\]\(([^)\s]+)")
TICK = re.compile(r"`([^`\s]+)`")
EXT = re.compile(r"\.[A-Za-z0-9]+$")


def clean(raw: str) -> str:
    return re.sub(r":\d[\d-]*$", "", raw.split("#", 1)[0])


def candidates(text: str):
    yield from (clean(m.group(1)) for m in LINK.finditer(text))
    for m in TICK.finditer(text):
        t = clean(m.group(1))
        if "/" in t and (t.endswith("/") or EXT.search(t)):
            yield t


def exists(root: Path, doc: str, raw: str) -> bool:
    # Markdown links resolve from the doc's folder; backticked paths from the repo root; `*` is a glob.
    bases = (root, (root / doc).parent)
    return any(any(b.glob(raw)) if "*" in raw else (b / raw).exists() for b in bases)


def check(root: Path = ROOT, docs: list[str] = DOCS) -> list[str]:
    missing = []
    for doc in docs:
        if not (root / doc).exists():
            missing.append(doc)
            continue
        for raw in candidates((root / doc).read_text()):
            if raw and "://" not in raw and not raw.startswith("mailto:") and not exists(root, doc, raw):
                missing.append(f"{doc}: {raw}")
    return missing


def main() -> int:
    missing = check()
    for m in missing:
        print(m)
    return 1 if missing else 0


if __name__ == "__main__":
    sys.exit(main())
