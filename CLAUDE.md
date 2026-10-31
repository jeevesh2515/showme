# CLAUDE.md — ShowMe (synced copy of AGENTS.md; AGENTS.md is canonical, edit there then re-copy)

Screenshot + goal → one highlighted step at a time on the user's own screen. Browser redacts before upload. Meta API: `muse-spark-1.3` grounding, `sam-3.1` outline. Hackathon: freeze Mon Nov 2 23:59, submit Wed Nov 4 18:00 London.

Detail lives in `docs/` — do not duplicate it here.

## Repo state (verify, don't assume)

- Days 1 to 6 built: `apps/web`, `backend`, `eval`, `scripts/`, `Makefile`, `docker-compose.yml`, `README.md`. Day 7 (hardening, feature freeze Mon Nov 2 23:59) is next.
- Open founder items: Day 3 phone OCR timing, Day 4 founder phone run, Day 6 usability sessions.
- `spikes/` is throwaway verification code: never import from it, never ship it.
- `AGENTS.md` is canonical; `CLAUDE.md` is a synced copy. Keep both in sync on rule changes: edit `AGENTS.md`, then re-copy.

## Read before any change (in order)

1. `docs/RULES.md` — privacy P1–P9, "never fake a result", coding/testing/commit duties. Binding; if blocked, record conflict in `docs/MEMORY.md` Open questions, don't work around.
2. `docs/PHASES.md` today's section + `docs/prompts/00-common.md` (session protocol, spend, end-of-day duties) + today's `docs/prompts/day-*.md`.
3. Doc for the area you touch: `docs/ARCHITECTURE.md` (contracts, prompt/schema, SAM, redaction, storage, hosting, eval), `docs/DESIGN.md` (tokens/overlay/copy/a11y), `docs/REQUIREMENTS.md` (IDs).
4. Latest `docs/MEMORY.md` entries (decisions D*, assumptions, open Q*) + `docs/RISKS.md` kill criteria. Evidence: `docs/SPIKES.md`.

Docs win over code until a MEMORY.md decision changes them. Update the doc in the same commit as the code. No requirement ID → not in scope; propose in MEMORY.md first.

## Non-negotiables (full text: RULES.md)

- Raw screenshot never leaves browser; only `RedactedImage` from `redact()` reaches network. No other constructor/cast/`as RedactedImage`. Redaction review cannot be skipped or flagged off in prod.
- Backend never logs/stores images, goal text, instructions, `reason`, or raw IPs. Only exception: salted daily-rotated IP hash in `usage_counters`, deleted after 48 h. Log metadata only.
- Nothing persists beyond tab without opt-in Share (consent + second review, 7-day expiry on every read, token stored hashed only).
- Never use `*-contributor` Meta models (grants Meta content rights). Standard mode only.
- No third-party scripts that can read page; OCR/font assets self-hosted. Never ask user to remove blur or reveal password/code/card.
- Secrets only in `.env` (local) / platform secrets. Never print, log, commit, or paste values; refer by name (`MODEL_API_KEY`).
- Never fake result: every published number comes from generated file in `eval/results/`; never hand-edit `RESULTS.md`/`summary.json`/`predictions.jsonl`; write "not run" instead of estimating. Label estimates with arithmetic.
- SAM never moves click point; outline only when it agrees with model box (see below).

## Layout (ARCHITECTURE.md §2)

- `apps/web`: Next.js 14 App Router, TS strict (no `any`, no `!` on API data). Redaction in `lib/redaction/`; API client generated from OpenAPI, never hand-written.
- `backend`: FastAPI, Python 3.11 + `uv`, Pydantic v2. `showme/core` is pure (no FastAPI, no env reads, no globals; settings passed in) and imported by both API and eval so eval runs production path.
- `eval`: ScreenSpot-v2/Pro, negatives, 20-task Playwright E2E; results in `eval/results/`.
- `.learnings/`: step log + interview Q&A; update per RULES.md §7.

## Model/API gotchas (measured, SPIKES.md)

- Base `https://api.meta.ai/v1`, bearer `MODEL_API_KEY`. Default `muse-spark-1.3` with `reasoning_effort=minimal` (same 10/10 as default, ~½ latency/cost ~$0.0051/call); `muse-wonder-1.0` is escalation/comparison only (~3× cost). Pin model IDs. D19: Spark `medium`/`high` and Wonder `high`/`max` allowed on hard tasks — log model+effort+cost per call, announce estimate first, day ceiling still binds. D18: `*-contributor` banned at every effort, no exceptions.
- Strict JSON schema: every object needs `additionalProperties: false` and all props required, or call fails. Coords on 0–1000 grid; values can exceed 1000 — clamp in postprocess.
- Confidence is uncalibrated (0.95–0.98 on every hit) — never gate honesty on it alone; calibration/verifier decided Day 3 (ARCHITECTURE §5.5).
- SAM 3.1 via `POST /v1/responses` + `meta-sam-parser`; prompt with model **box** (IoU 0.51) not point (0.41). Keep mask payload leading `!`. Agreement gate: IoU ≥ 0.5, SAM box contains model point, SAM area ≤ 25% image; else `{"mode":"box"}`. Timeout 4 s; SAM failure never fails step. Two calls (`/v1/step` then `/v1/refine`) so box shows ~1.3 s sooner.
- Prompts/schemas are versioned constants (`PROMPT_VERSION` in `showme/core/prompts.py`/`schema.py`); any change bumps version + requires dev-split eval. Tune only on dev split; held-out/Pro for reporting.
- Rate limits per team (3,000 RPM); retry 429 with backoff+jitter from 500 ms, max 3, honour `Retry-After`.

## Commands

Load key without printing (every live run):
```bash
set -a; . ./.env; set +a
```

Spikes (throwaway):
```bash
cd spikes/grounding && EFFORT=minimal python3.11 -I smoke.py ../data/screenspot10 muse-spark-1.3
cd spikes/sam && .venv/bin/python api_sam.py
cd spikes/redaction && node run.mjs
```

Make targets:
```bash
make setup        # uv sync + pnpm install
make dev          # web :3000, API :8000
make test         # pytest + vitest
make lint         # ruff, mypy --strict (core), eslint, tsc
make smoke        # live 10-sample grounding smoke (~$0.05)
make eval SUITE=screenspot-v2|screenspot-pro|negatives|all [N=300] [MODEL=muse-spark-1.3] [EFFORT=minimal]
make e2e          # 20-task Playwright suite against running stack
uv run --project backend pytest backend/tests/test_postprocess.py::test_api_3_clamps_1001   # single backend test
pnpm --filter web vitest run lib/redaction/patterns.test.ts              # single web test
```

## Testing & eval rules

- Tests named after requirement ID (`test_api_3_clamps_1001`, `priv-1.spec.ts`). Bug fix starts with failing repro test.
- Unit tests never call real Meta API — `respx` recorded fixtures under `tests/fixtures/` only. Live calls only via `make smoke|eval|e2e` or announced manual check.
- Before live run: state call count + estimated cost (ground ~$0.0051, Wonder ~$0.0157, SAM $0.0025). Check `eval/results/spend.json`; stop if run would exceed day ceiling in prompt or push total eval > $40 / total account > $110 (R6; $107 plan pre-approved in MEMORY D14) without founder OK.
- Eval writes `predictions.jsonl` + `summary.json` + `report.md` with git SHA, prompt version, model, effort, date, cost. Unchanged config must hit response cache ($0).

## Git & docs duties

- Conventional Commits (`feat(web):`, `fix(api):`, `test(eval):`, `docs:`, `chore(ci):`) with `Refs: PRIV-1, FLOW-4` in body. One logical change; `main` always deployable.
- Before commit/push: ponytail review (delete dead code, stdlib/native first, no premature abstraction, shrink), re-run affected tests, paste command+result. Never commit `.env`, datasets, `node_modules`/`.venv`, or screenshots with real personal data.
- End of session (00-common.md §8): `make lint test` summary → tick PHASES.md (verified only) → MEMORY.md daily entry (D-numbers continue) → `.learnings/00-step-log.md` (S-numbers continue) → update `.learnings/01`–`10` if answers changed → founder briefing `.learnings/daily/<date>.md`.

## Agent quirks

- Do not use `claude-api` skill (this is Meta API, not Anthropic) or `gsd-*` agents (different planning layout).
- Building/restyling screen: load `frontend-design` skill but `docs/DESIGN.md` tokens/copy override its taste. Library syntax: check docs (context7/WebFetch Meta docs) over memory; cite URL in MEMORY.md if it changes decision.
- Subagents: self-contained brief, disjoint file ownership, main agent owns integration + full test run. `sonnet` feature/research, `haiku` mechanical.
