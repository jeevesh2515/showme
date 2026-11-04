# Phases: day-by-day plan

All times London. Internal deadline **Tue Nov 3, 23:59**. Official deadline Wed Nov 4, 21:00 EST = **Thu Nov 5, 02:00 London**. Nov 4 is buffer only; target submission Nov 4 by 18:00 London.

**Feature freeze: Mon Nov 2, 23:59.** After freeze: bug fixes, copy, docs, video, submission only.

Ordering logic: evaluation runs on Day 2 to 3 and deployment on Day 4, so a bad accuracy, latency or hosting result still leaves 3 to 4 days to react. The core loop works end to end on Day 4; everything after that is polish, sharing and evidence.

How to use: start each day by pasting the matching agent prompt from [prompts/](prompts/README.md) into a fresh session (it follows this file). Tick boxes as you go; at the end of each day, write the MEMORY.md daily entry and update `.learnings/00-step-log.md`. If a day's DoD is not met, the first task next morning is to close it or record the cut in MEMORY.md.

---

## Day 1 · Tue Oct 27 · Verify and plan

- [x] Spikes (a) to (d) with evidence → `docs/SPIKES.md`
- [x] Docs: PRD, REQUIREMENTS, ARCHITECTURE, RULES, PHASES, DESIGN, MEMORY, RISKS
- [x] `.learnings/` step log and interview Q&A
- [x] Founder approval of the plan (blocking) — approved 2026-10-27, see MEMORY D14
- [x] Founder answers the top questions in MEMORY.md (track, repo, accounts) — Q1/Q2/Q3/Q5/Q6/Q7 answered in D14; Q4/Q11 stay open
- [x] After approval: `git init`, public GitHub repo, MIT licence (if agreed), push docs — verified by `scripts/score_gate.py`

**DoD:** plan approved; repo exists with docs and `.gitignore`; `.env` not tracked.

## Day 2 · Wed Oct 28 · Backend core + eval harness skeleton

- [x] Monorepo skeleton per ARCHITECTURE §2; `Makefile` targets `setup dev test lint eval e2e`
- [x] `showme/core`: `prompts.py` (v1), `schema.py`, `grounding.py` (httpx, retries, 429), `postprocess.py`, `sam.py` (box prompt, mask → SVG, agreement check), `pricing.py`
- [x] Unit tests: API-2, API-3, API-4, API-5 (respx recorded fixtures)
- [x] FastAPI: `/v1/step`, `/v1/refine`, `/v1/healthz`; Pydantic models; error codes (API-1, API-7)
- [x] Rate limiter + spend cap with an in-memory backend for local dev (API-6). Supabase backend lands Day 5 behind the same interface
- [x] Dockerfile; `docker compose up` serves the API (ENG-1)
- [x] CI: ruff, mypy, pytest, Docker build, gitleaks (ENG-2 backend half; API-8 OpenAPI drift lands Day 4) - green on `day-2-backend-core-eval`, run 40639260225
- [x] Eval: dataset loaders for ScreenSpot-v2 and -Pro (download, bbox conversion with unit tests), runner with response cache, `predictions.jsonl` writer
- [x] Run the v2 **dev split (100)** with Muse Spark minimal; record the number (spike was n=10 on v1, no comparable baseline); stop only below 75% per RISKS R1 early warning

**DoD:** `curl /v1/step` with a real screenshot returns a valid step locally; CI green; dev-split result written by the harness (not by hand). **Met 2026-10-28** (93.0% dev-100 at 2560 px, `eval/results/2026-10-28-screenspot-v2-muse-spark-1.3-minimal-samoff-max2560/report.md`).

## Day 3 · Thu Oct 29 · Evaluation day + redaction in the browser

- [x] Full ScreenSpot-v2 held-out run (Spark minimal) → accuracy by platform × element type
- [x] ScreenSpot-Pro stratified 300: Spark minimal and Wonder minimal
- [x] Negatives suite (200) + 10 prompt-injection + 10 harmful-goal probes → honesty and refusal rates
- [x] Calibration: AUROC + reliability bins; decide τ and whether the verifier pass is on (ARCHITECTURE §5.5); record in MEMORY.md
- [x] Highlight ablation on v2 sample: model box vs SAM agreement-gated (EVAL-4)
- [x] `RESULTS.md` v1 generated; **decision checkpoint** (see RISKS.md kill criteria): effort level, Wonder escalation, verifier
- [x] Next.js app skeleton; redaction worker (tesseract.js self-hosted), `patterns.ts`, `redact()` with `RedactedImage` brand; vitest corpus (FLOW-2, PRIV-7, PRIV-9)
- [ ] Measure OCR time in a real browser on a laptop and a mid-range phone (dev-only bench page)

**DoD:** `RESULTS.md` exists with real numbers and links to raw JSONL; checkpoint decisions recorded; redaction unit tests green.

## Day 4 · Fri Oct 30 · Core loop end to end + first deploy

- [x] Upload / paste / drag + goal input (FLOW-1)
- [x] Review screen: auto blurs, tap-to-blur line, brush, undo, zoom (FLOW-3, PRIV-2)
- [x] Step call, overlay box with numbered badge, instruction card (FLOW-4), refine swap to outline (FLOW-5)
- [x] States: unsure, not_visible, done, refuse, caution (FLOW-6 to FLOW-10)
- [x] Next-screenshot loop with text-only history; "That didn't work" (FLOW-11, FLOW-12)
- [x] Generated TS client from OpenAPI; drift check in CI (API-8)
- [x] Deploy: Vercel web + Vercel Python API, env vars set, rewrites `/api/*`; verify body-size limit with a 1920 px JPEG
- [x] PRIV-1 Playwright test (request bodies never contain the original image)
- [x] 5 manual real-use-case runs on the live site → `eval/manual/2026-10-30/`
- [ ] Founder runs one real task of their own on their phone (pending founder)

**DoD:** **public URL live** (WEB-3); a real screenshot goes through redaction → step → outline on the deployed site; PRIV-1 test green in CI.

## Day 5 · Sat Oct 31 · Share, accessibility, E2E harness

- [x] Supabase project (EU), tables + RLS, private bucket (ARCHITECTURE §8)
- [x] `/v1/guides` create/get/delete, `/g/[token]` page, second review + consent (PRIV-5)
- [x] Vercel Cron → `/internal/purge`; expiry test
- [x] Production rate limits + spend cap on Supabase (API-6)
- [x] Accessibility pass: A11Y-1 to A11Y-7; read-aloud (FLOW-13)
- [x] E2E: `tasks.yaml` with 20 public tasks; Playwright driver; run the first 10

**DoD:** share link works end to end and expires in a test with a shortened TTL; axe clean on all screens; first E2E numbers written by the harness.

## Day 6 · Sun Nov 1 · Fix what the evidence says + landing page

- [x] Full E2E run (20 tasks); highlight CSV generated
- [ ] Human-rate highlight quality per step (rating cells still empty: not run)
- [ ] Usability test with 2 to 3 people (kit in `eval/usability/`); summary with counts and quotes, n stated
- [x] Triage the top 3 failure modes from eval + E2E; fix with dev-split re-runs only (prompt version bump each time)
- [x] Landing page (WEB-1) and `/eval` page (WEB-2) with numbers pulled from `RESULTS.md`
- [ ] Stretch S1 (voice via Muse Voice Transcribe) only if Days 2 to 5 DoD are all green

**DoD:** E2E success rate and average steps reported; landing page live; every number on it traceable to a results file.

## Day 7 · Mon Nov 2 · Hardening · FEATURE FREEZE 23:59

- [ ] Security pass: CSP and headers, secrets scan, no PII in logs (PRIV-3 test), rate limits from a second IP, spend cap trip test
- [ ] `docs/REQUIREMENTS_STATUS.md` inventory exists; every M requirement green or cut with a D-number (reopened by November 2 independent review: brush coverage, unsure SAM styling, negatives split isolation and PRIV-11 evidence remain open; see REVIEW-2026-11-02.md)
- [x] `docs/SECURITY.md` threat model
- [x] Final eval re-run on held-out + Pro with the frozen prompt version; regenerate `RESULTS.md`
- [ ] Performance: Lighthouse ≥ 90; step p50/p95 from production logs
- [x] README draft (ENG-4) with Limitations section
- [ ] Stretch S2 to S3 only if everything above is done before 18:00
- [x] **Freeze at 23:59**: tag `v1.0.0-rc1`

**DoD:** all M requirements green or explicitly cut in MEMORY.md; final numbers generated from the frozen build.

## Day 8 · Tue Nov 3 · Ship the submission (internal deadline 23:59)

- [ ] Record the demo video (script in DESIGN.md §7); edit to 2 to 3 min; captions — November4: v5 exports180.000s/44.600s with user-confirmed iPhone16 self-demo, explanatory motion and frame-accurate scenes; full human playback/privacy approval and hosted-video/submission remain open. — November 3: Callum candidates verified at 180.000s and 44.600s (docs/video/README.md); physical recipient footage, production/device parity and human final acceptance remain open. — November 2: 180-second 1080p review cut with rehearsal voice and labelled mobile emulation exported; founder voice/physical iPhone and final caption alignment pending (docs/video/README.md). — Later November4: continuity v2 candidates verified at180.000s/44.600s; independent visual-only editorial scores8.6/8.5. Human playback/hosting/submission still open; see redesign/CONTINUITY-HANDOFF.md. — Readable finish: text covers replaced by light emphasis, complete180s/44.6s exports verified; Downloads delivery and GitHub/X/submission checklist prepared. Final viewing, hosted URL, new PR CI and portal confirmation remain open.
- [x] Production QA checklist on 5 browsers/devices → `eval/qa/2026-11-03.md`; bugs fixed test-first or listed in README Limitations — file written 2026-11-03; Chromium + founder physical phone verified, other browsers listed open inside
- [x] `docs/SUBMISSION.md` drafted; script cross-checks every number against `RESULTS.md` — `scripts/check_submission_numbers.py` ok 2026-11-03
- [ ] Interview drill: `.learnings/11-final-interview-drill.md` + live quiz — file written; live quiz with founder still to run
- [x] README final: demo GIF, architecture diagram, one-command setup, eval reproduction, privacy, limitations, licence — verified 2026-11-03
- [x] Fresh-clone dry run: `make setup && make test && make eval SUITE=negatives N=20` (EVAL-1, ENG-1) — setup+test verified on fresh clone of 75fbb8e 2026-11-03; paid negatives re-run not run (eval ceiling ~$0.27 headroom, needs founder approval)
- [x] Submission text drafted (problem, solution, Meta models used and how, eval results, business hypothesis, links) — SUBMISSION §7 added 2026-11-03; video link still pending founder upload
- [ ] Final deploy from tag `v1.0.0`; smoke test on phone and desktop
- [ ] `.learnings/` Q&A reviewed and updated with final numbers

**DoD:** everything required for the submission form exists and is linked; internal deadline met.

## Buffer · Wed Nov 4 · Submit

- [ ] Re-check the live URL, video link, repo visibility
- [ ] Submit by 18:00 London (8 hours before the official deadline)
- [x] `docs/RUNBOOK.md` for judging week (health, logs, spend, rollback) — written 2026-11-03
- [x] Keep spend cap on; monitor during judging (Nov 4 to 8) — $5.00 daily trip enabled and active

---

## Cut list (apply in this order if behind)

1. Stretch S6 → S5 → S4 → S3 → S2 → S1 (never started if MVP is not green).
2. Human-rated highlight CSV (keep the IoU ablation).
3. E2E from 20 to 12 tasks (state the reduced number).
4. Share guide images (keep text-only guides).
5. Never cut: PRIV-1 to PRIV-9, eval honesty reporting, public URL, README limitations.
