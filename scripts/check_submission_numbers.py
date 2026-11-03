"""Day 8 Phase 4: headline numbers in SUBMISSION.md must exist in their generated source files.
Reads only; never edits generated files (RULES §2). Usage: python3 scripts/check_submission_numbers.py"""
import pathlib, sys

root = pathlib.Path(__file__).parent.parent
sources = {
    "89.9%": "eval/results/RESULTS.md",
    "62.0%": "eval/results/RESULTS.md",
    "151/200": "eval/results/2026-11-02-negatives-heldout-n222-977dad4c-muse-spark-1.3-minimal-samoff-max2560-pvv3-e2f82896/report.md",
    "75.5%": "eval/results/2026-11-02-negatives-heldout-n222-977dad4c-muse-spark-1.3-minimal-samoff-max2560-pvv3-e2f82896/report.md",
    "12/20": "eval/results/2026-11-02-e2e-bb543ba-04574992c7/report.md",
}
submission = (root / "docs/SUBMISSION.md").read_text()
missing = []
for needle, rel in sources.items():
    if needle not in (root / rel).read_text():
        missing.append(f"{needle!r} not in generated source {rel}")
    if needle not in submission:
        missing.append(f"{needle!r} missing from SUBMISSION.md")
print("\n".join(missing) if missing else "ok: SUBMISSION headline numbers match generated sources")
sys.exit(1 if missing else 0)
