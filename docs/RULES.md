# Rules: ShowMe

These rules bind every human and AI agent working in this repo. If a rule blocks you, stop and record the conflict in [MEMORY.md](MEMORY.md) under Open questions; do not work around it.

## 0. Before you change anything

1. Read, in order: `CLAUDE.md` → this file → [PHASES.md](PHASES.md) (today's checklist) → the doc for the area you touch ([ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), [REQUIREMENTS.md](REQUIREMENTS.md)) → the last 20 entries of [MEMORY.md](MEMORY.md).
2. Find the requirement ID(s) your change serves. No ID → it is not in scope; ask or add it to MEMORY.md as a proposal first.
3. If the docs and the code disagree, the docs win until a decision in MEMORY.md changes them. Update the doc in the same commit as the code.

## 1. Privacy rules (non-negotiable)

| # | Rule |
| --- | --- |
| P1 | The raw screenshot never leaves the browser. Only `RedactedImage` (created by `redact()`) may reach the network layer. Do not add any other constructor, cast, or `as RedactedImage`. |
| P2 | Redaction review cannot be skipped, bypassed by a flag, or disabled in production builds. Test fixtures may call `redact()` directly; UI may not. |
| P3 | The backend never writes images, goal text, instructions, `reason`, or raw IPs to disk, logs, error trackers or analytics (the only exception: a salted, daily-rotated IP hash in `usage_counters` for rate limiting, deleted after 48 h). Log metadata only (route, status, latency, tokens, cost, model, request id). |
| P4 | No persistence beyond the tab without opt-in Share. No images or goals in cookies, localStorage, sessionStorage or IndexedDB. |
| P5 | Shared guides: consent checkbox + second review of every image; 7-day expiry checked on every read; token stored only as a hash; delete key works. |
| P6 | Meta Model API in standard mode only. Never use `*-contributor` models (they grant Meta rights to the content). |
| P7 | No third-party scripts that can read the page. OCR assets are self-hosted. New external hosts require a CSP change reviewed against this rule. |
| P8 | Never ask the user to remove a blur, reveal a password, code or card number, in prompts, UI copy or instructions. |
| P9 | Secrets live in `.env` (local) and Vercel/GitHub secrets only. Never print, log, commit or paste key values; refer to them by name. |

A change that weakens any P-rule needs an explicit founder decision recorded in MEMORY.md before it is written.

## 2. Never fake a result

- Every number in the README, landing page, `/eval`, demo video or submission text comes from an eval or E2E output file in `eval/results/` and links to it.
- Never hand-edit `RESULTS.md`, `summary.json` or `predictions.jsonl`. They are generated.
- Mocks and recorded API fixtures are allowed in tests only, live under `tests/fixtures/`, and are never shown as product output.
- The demo video shows the live product on real screenshots. No edited overlays, no cherry-picked takes without saying so ("best of 3 runs" is fine if stated).
- Report bad results with the same prominence as good ones. If a feature does not work, the README "Limitations" section says so.
- If a benchmark number is not run yet, write "not run" rather than an estimate.
- Estimates (for example cost) are labelled **estimate** and show the arithmetic.

## 3. Coding standards

### General
- Smallest change that fully meets the requirement. No speculative abstractions, options or "for later" code.
- Reuse existing modules before adding new ones; no new dependency for a few lines of code.
- Comments explain *why*, not *what*. A known shortcut gets `# shortcut: <limit>, <when to upgrade>`.
- No dead code, no commented-out code, no unused imports.

### TypeScript / Next.js (`apps/web`)
- `strict: true`, no `any` (use `unknown` + narrowing), no non-null `!` on API data.
- App Router; server components by default, `"use client"` only where needed (canvas, worker, media).
- API types come only from the generated OpenAPI client.
- ESLint (next/core-web-vitals) + Prettier; Tailwind with design tokens from DESIGN.md §2; no inline hex colours.
- Load the `frontend-design` skill (or equivalent) before building or restyling a screen; follow DESIGN.md over generic taste.

### Python (`backend`, `eval`)
- Python 3.11, `uv` for env and deps, Pydantic v2 for every boundary, full type hints, `mypy --strict` on `showme/core`.
- `ruff` (lint + format). `httpx` async client with explicit timeouts.
- `showme/core` is pure: no FastAPI, no env reads, no global state. Settings are passed in.
- Prompts and schemas are versioned constants in `showme/core/prompts.py` and `schema.py` (`PROMPT_VERSION = "v1"`). Any change bumps the version and needs an eval run on the dev split.

## 4. Testing rules

- Every requirement with "Verified by" pytest/vitest/Playwright gets a test named after its ID (`test_api_3_clamps_1001`, `priv-1.spec.ts`).
- Must-have unit tests: grounding parser and post-processing (table-driven edge cases), SAM wrapper (recorded responses, mask decode, agreement check, timeout path), redaction patterns (fixture corpus) and canvas encode (EXIF stripped, size cap), every API route (happy path + each error code).
- Unit tests never call the real Meta API. Use respx with recorded fixtures. Live calls only in `make eval`, `make e2e` and `make smoke`.
- A bug fix starts with a failing test that reproduces it.
- CI must be green before merge to `main` and before deploy.
- Re-run the affected tests after any refactor or pruning; paste the command and result in the PR/commit body.

## 5. Eval rules

- Eval uses `showme.core` and production preprocessing (EVAL-2). No eval-only prompt tricks.
- Tune only on the dev split (EVAL-9). The held-out split and ScreenSpot-Pro are for reporting.
- Every run writes `predictions.jsonl` + `summary.json` + `report.md` with the git SHA, prompt version, model, effort, date and cost.
- Re-running an unchanged config hits the response cache and costs $0; changing the prompt version invalidates it.
- Spend: check `eval/results/spend.json` before a large run; stop and record in MEMORY.md if total eval spend would exceed $40.

## 6. Git and commits

- Conventional Commits: `feat(web): ...`, `fix(api): ...`, `test(eval): ...`, `docs: ...`, `chore(ci): ...`. Reference requirement IDs in the body (`Refs: PRIV-1, FLOW-4`).
- One logical change per commit. Commit messages explain why.
- Branch: short-lived feature branches merged to `main` via PR (solo: self-review with the checklist below); `main` is always deployable.
- Before every commit or push, apply the pre-push review: delete dead code, prefer stdlib/native, no premature abstraction, shrink verbose logic, never weaken security or privacy, re-run tests.
- Never commit `.env`, datasets, model outputs other than `eval/results/**`, or screenshots of real personal accounts.
- Attribution lines required by the tooling go at the end of commit messages and PR bodies.

## 7. Documentation duties (agents included)

| When | Update |
| --- | --- |
| Any decision that changes scope, architecture, a threshold, a model, or a rule | MEMORY.md decision log (date, decision, why, evidence link) |
| A new assumption or an assumption confirmed/refuted | MEMORY.md assumptions table |
| End of each working day | PHASES.md checkboxes for that day; MEMORY.md daily entry; founder briefing `.learnings/daily/<date>.md` (format in `docs/prompts/00-common.md` §8) |
| Any notable step (spike, eval run, deploy, incident, pivot) | `.learnings/00-step-log.md` entry, and the matching Q&A file in `.learnings/` if it changes an answer |
| A doc and the code disagree | Fix the doc in the same commit |

## 8. Definition of done (any task)

- Requirement ID(s) met and their tests pass locally and in CI.
- Privacy rules P1 to P9 still hold (checked, not assumed).
- Docs updated per §7.
- No new warnings from lint or type-check.
- For UI: keyboard-only run and axe check done on the changed screen.
