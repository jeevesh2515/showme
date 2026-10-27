You are the founding engineer for ShowMe in /Users/jeeveshsingale/dev/ShowMe. Today is **Day 2, Wed Oct 28, 2026**. Theme: **backend core + eval harness skeleton**. Budget for live API calls today: **$3**.

## Founder decisions (filled in by the founder; do not re-ask)
- Plan in /docs: APPROVED (MEMORY D14), including FastAPI as a Vercel Python Function (Docker for local, CI and fallback).
- Track: INDIE
- Git remote: public GitHub repo `showme` under `jeevesh2515` (created Day 1 evening; `git remote -v` to confirm). If missing: `gh repo create showme --public` (MIT LICENSE already in repo root).
- Licence: MIT
- Public demo spend cap: $60 total, $5 per day. Total plan $107 pre-approved; stop at $110 (RISKS R6).
- Accounts: Vercel + Supabase ready (EU London preferred). `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET` are optional (empty allowed) until Day 5.
- Day 2 Makefile scope: `setup` = `uv sync` only and `dev` = API only (web starts Day 3; add pnpm/web targets then).

## Read first
1. `docs/prompts/00-common.md` and follow its session start protocol.
2. `docs/ARCHITECTURE.md` §2 to §6, §9, §11, §13 (you implement these today).
3. `docs/REQUIREMENTS.md` IDs: API-1 to API-7, PRIV-3, PRIV-6, PRIV-7, EVAL-2, EVAL-7, EVAL-9, ENG-1 to ENG-3.
4. `docs/SPIKES.md` (measured facts) and the spike scripts you will learn from (do not import them): `spikes/grounding/smoke.py`, `spikes/grounding/fetch_samples.py`, `spikes/sam/api_sam.py`, `spikes/sam/pipeline_preview.py`.

Gotchas already learned (do not rediscover them):
- Strict JSON schema needs `additionalProperties: false` on every object and every property in `required`.
- `reasoning_effort: "minimal"` gave the same 10/10 as default at half the latency. `none` returns HTTP 400.
- Muse Spark coordinates are on a 0 to 1000 grid and can come back as 1001: clamp.
- SAM mask token `data=H,W,<payload>`: pass the payload **including its leading `!`** to `SegmentationMask(encoding="one_bit", ...)`. The mask is cropped to its box; the SVG path is box-local.
- `pip install meta-sam-parser` (import `meta_sam_parser`). Usage tokens for SAM come back as 0; bill by image.
- HF dataset `rootsautomation/ScreenSpot` is renamed `bevaya/ScreenSpot`; the datasets-server `/filter` endpoint times out, `/rows` works; mobile images are JPEG.

## Phase 1 · Foundation (morning, ~2 h)
- If approved: `git init`, add the remote or create it with `gh repo create showme --public`, licence file, first commit of docs and spikes (respect `.gitignore`).
- Monorepo skeleton per ARCHITECTURE §2: `backend/` (uv, Python 3.11, package `showme` with `core/` and `api/`), `eval/` (uv project with a path dependency on backend), `apps/web/` with only a README placeholder (Next.js starts Day 3).
- Subagent C (haiku), owns only these files: `Makefile` (setup, dev, test, lint, smoke, eval, e2e stub), `backend/Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` (ruff, mypy --strict on showme/core, pytest, Docker build, gitleaks), `.env.example` kept in sync with ARCHITECTURE §11.
- **Check:** `make setup && make lint` runs clean on the empty skeleton; CI workflow passes on GitHub (if a remote exists).

## Phase 2 · Core logic (you, the main agent; critical path, ~4 h)
Build `backend/showme/core/` test-first. It must stay pure: no FastAPI, no env reads, no globals; settings passed in.
- `prompts.py`: system prompt v1 exactly as ARCHITECTURE §5.2; `PROMPT_VERSION = "v1"`; user message builder (goal plus text-only history).
- `schema.py`: §5.3 schema; Pydantic models for model output and `StepResult`.
- `grounding.py`: async httpx call to `{base}/chat/completions` per §5.1; one retry on unparsable output then `ModelError`; 429 backoff with jitter from 500 ms honouring `Retry-After`, max 3 tries; timeouts per §9; returns parsed output, usage, latency.
- `postprocess.py`: §5.4 steps 1 to 7 as one pure function.
- `sam.py`: §6 exactly (box prompt, regex parse, mask to SVG path, agreement check, 4 s timeout, any failure returns mode "box").
- `pricing.py` and `pii.py` (patterns listed in ARCHITECTURE §7, same rules the browser will use).
- Tests named by requirement ID with respx fixtures. Record 2 to 3 real Muse and SAM responses once into `backend/tests/fixtures/` (check that no key or private data is inside).
- Frozen core signatures (Subagent B builds eval against these, do not change without telling B): `ground(image_data_url, goal, history, settings) -> (ModelOutput, usage, latency_ms)`; `postprocess(raw, width, height, tau) -> StepResult`; `refine(image_data_url, box, point, settings) -> Refinement`; `mask_pii(text) -> str`.
- **Check:** `uv run --project backend pytest backend/tests -q` green; `uv run --project backend mypy --strict backend/showme/core` clean.

## Phase 3 · API (subagent D, sonnet, after Phase 2 lands; owns `backend/showme/api/` and its tests)
- `/v1/step`, `/v1/refine`, `/v1/healthz` with models and error codes exactly as ARCHITECTURE §4.
- Settings via pydantic-settings; validator rejects any model id containing `contributor` (PRIV-6).
- `RateLimiter` and `SpendCap` interface with an in-memory implementation now (Supabase on Day 5).
- JSON logs with metadata only, plus a log-capture test proving no goal text, image bytes or IPs appear (PRIV-3).
- **Check:** `docker compose up` then `curl -s localhost:8000/v1/healthz`; a real `/v1/step` call with `spikes/redaction/fixtures/billing.png` (converted to a data URL by a small script) returns a valid StepResult; `/v1/refine` returns an outline or box.

## Phase 4 · Eval harness skeleton (subagent B, sonnet, runs in parallel with Phase 2; owns only `eval/`)
- Loaders: ScreenSpot-v2 (`OS-Copilot/ScreenSpot-v2`, bbox absolute xywh, inferred) and ScreenSpot-Pro (`likaixin/ScreenSpot-Pro`, absolute xyxy; download only sampled images). Unit test: draw 5 boxes per dataset onto the images, save to `eval/debug/` (gitignored) and look at them before trusting the format. Record the true v2 sample count in MEMORY.md (it is UNVERIFIED today).
- Seeded dev split = first 100 of a seeded shuffle of v2 (seed 0). Runner refuses to call a dev-split run "headline" (EVAL-9).
- Runner imports `showme.core` (EVAL-2), applies production preprocessing (long side ≤ 1920, JPEG q=0.85), caches by (model, effort, prompt_version, image_sha256, instruction, sam_on), writes `eval/results/<date>-<suite>-<config>/predictions.jsonl`, `summary.json`, `report.md` with git SHA, prompt version, model, effort, cost; updates `eval/results/spend.json`.
- `make smoke` = 10 v2 samples, live. Phase 5 dev run command: `make eval SUITE=screenspot-v2 SPLIT=dev N=100 SAM=off`.

## Phase 5 · First real numbers (evening, ~$2)
- `make smoke`, then the v2 dev split (100) with `muse-spark-1.3` minimal.
- Assumption A7: rerun the same 100 at native resolution and compare with 1920 px (~$0.50). Record the result and decide in MEMORY.md (a new D-number) if the cap should change.
- If dev-split accuracy is below 75%: stop and report to the founder (RISKS R1 early warning) before doing anything else.

## Review and close
- `agent-skills:test-engineer` on core and API tests; `agent-skills:security-auditor` on logging, settings and secrets; `code-review:code-review` on the day's diff. Fix confirmed findings.
- Follow `00-common.md` §8 end-of-session duties, including `.learnings/daily/2026-10-28.md`.

## Definition of done (Day 2)
- `curl` to local `/v1/step` with a real screenshot returns a valid StepResult; `/v1/refine` works or degrades to box.
- `make lint test` green locally and in CI.
- Dev-split `report.md` generated by the harness, with spend recorded.
- A7 decided with evidence.

## Founder tasks today (human, ~30 min)
- Read `.learnings/daily/2026-10-28.md` tonight and answer its "explain it back" questions out loud.
- Find the hackathon Official Rules and paste the submission requirements into MEMORY.md Q4 if not done.
