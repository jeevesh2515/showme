# ShowMe

Screenshot + goal -> one highlighted step at a time on your own screen. Private details are hidden in the browser before upload.

Built for the Meta Global AI Developer Hackathon (Indie track) on Meta models: `muse-spark-1.3` for grounding, `sam-3.1` for outlines, via the Meta Model API.

## Status (2026-10-27, Day 1)

Plan and verification spikes complete. No application code yet - backend, web app and eval harness are built Day 2-4 per `docs/PHASES.md`.

- Plan: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/RULES.md`, `docs/PHASES.md`
- Measured spike evidence: `docs/SPIKES.md` (reproduction logs in `spikes/results/`)
- Score gate: `python3 scripts/score_gate.py` -> `docs/SCORE.md` (must be >= 8.5/10 with zero failing checks)
- Daily founder briefings: `.learnings/daily/`

## What is measured so far

Muse Spark 1.3 (`minimal`): 10/10 point-in-box on a 10-sample ScreenSpot smoke test, 5/5 honest "not visible" on absent targets (`spikes/results/2026-10-27-grounding-spark-minimal.txt`). Real benchmark numbers (ScreenSpot-v2/Pro, 20-task E2E) are **not run** yet - they land Day 3 and Day 5 and will be published whatever they are.

## Licence

MIT - see `LICENSE`.
