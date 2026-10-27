# Requirements: ShowMe

Testable requirements derived from [PRD.md](PRD.md). Each has an ID, a priority, and a verification method. Code, tests and commits reference these IDs (for example `test_priv_1_no_raw_image`).

Priority: **M** = MVP, must ship by feature freeze (Nov 2). **S** = stretch. Status is tracked in [MEMORY.md](MEMORY.md), not here.

## Privacy (non-negotiable; any failure blocks release)

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| PRIV-1 | The raw screenshot never leaves the browser. Only a `RedactedImage` produced by `redact()` can be passed to the API client. | M | TS brand type (compile-time) + Playwright test that inspects every request body and asserts no bytes/hash of the original fixture appear |
| PRIV-2 | Redaction review is mandatory before the first upload of every screenshot; there is no skip path. | M | Playwright: upload → API call impossible until "Continue" on review |
| PRIV-3 | The backend never writes images, goal text, instructions or raw IP addresses to disk or logs. The only IP-derived data stored is a salted, daily-rotated hash in `usage_counters` for rate limiting, deleted after 48 h. | M | pytest log-capture test on all routes; code review checklist |
| PRIV-4 | Nothing persists beyond the browser tab unless the user opts in to Share. No cookies, no localStorage of images or goals. | M | Playwright: after flow, storage and cookies contain no step data |
| PRIV-5 | Shared guides contain only redacted step images and text, require an explicit consent checkbox and a second review of every image, expire after 7 days, and can be deleted by the creator at any time. | M | pytest (expiry on read, purge job, delete key) + Playwright share flow |
| PRIV-6 | Meta Model API is called in standard mode only. Contributor-mode model IDs are rejected by config validation. | M | pytest on settings validator |
| PRIV-7 | Goal text and `type_text` pass through the PII patterns; matches are masked before leaving the browser / before returning to the client. | M | vitest + pytest |
| PRIV-8 | No third-party scripts that can read the page (no session replay, no ad pixels). OCR traineddata is self-hosted. | M | CSP header test; network log in Playwright shows only own origin + Supabase signed URLs |
| PRIV-9 | Canvas re-encode strips EXIF/GPS metadata from uploaded images. | M | vitest on encoded output |
| PRIV-10 | Prompts, UI copy and model output never ask the user to remove a blur or reveal a password, code or card number (RULES P8). | M | Prompt-snapshot test + UI-copy grep + refusal probes in negatives suite |
| PRIV-11 | Secrets never enter the repo, logs or browser bundle (RULES P9). | M | gitleaks on full history in CI; bundle scan proving `SUPABASE_SERVICE_ROLE_KEY` absent from web build |

## Core flow

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| FLOW-1 | User can upload, paste or drag a PNG/JPEG/WebP screenshot up to 20 MB and type a goal up to 300 chars. | M | Playwright |
| FLOW-2 | OCR + regex auto-blurs emails, phone numbers, card numbers (Luhn), UK postcodes, IBANs and digit runs ≥ 8. | M | vitest on the fixture corpus (≥ 30 strings incl. dark mode and 3x density) with recall ≥ 95%, false positives reported |
| FLOW-3 | Review screen supports tap-to-blur an OCR line, freehand brush, undo, and zoom. | M | Playwright |
| FLOW-4 | After upload, a highlight box appears for `ok`/`unsure` steps with a numbered badge and one instruction sentence. | M | Playwright with recorded API fixtures |
| FLOW-5 | When `/v1/refine` returns an outline, it replaces the box without layout shift. | M | Playwright visual snapshot |
| FLOW-6 | `not_visible` shows no highlight, the model's hint, and a scroll arrow if `scroll_direction` ≠ none. | M | Playwright |
| FLOW-7 | `unsure` shows a dashed highlight and the text "I think it is this one. Check before you tap." | M | Playwright |
| FLOW-8 | `done` shows a completion screen and offers Share. | M | Playwright |
| FLOW-9 | `refuse` shows a calm explanation and no highlight. | M | Playwright |
| FLOW-10 | A non-empty `caution` is shown above the instruction with a warning icon and text label (not colour alone). | M | Playwright + axe |
| FLOW-11 | "Next screenshot" keeps goal and step history in tab memory and sends history as text only. | M | vitest on request builder |
| FLOW-12 | "That didn't work" lets the user mark the last step failed; the next request includes `result: "failed"`. | M | vitest |
| FLOW-13 | Instructions can be read aloud with the browser's speech synthesis (on-device). | M | manual + Playwright button presence |
| FLOW-14 | Spoken goal via Muse Voice Transcribe, max 60 s, with typed fallback always visible. | S | Playwright with mocked endpoint |
| FLOW-15 | "Try harder" on `unsure` re-runs the step with `escalate: true` (Muse Wonder). | S | pytest + Playwright |

## Backend API

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| API-1 | `/v1/step` validates input per ARCHITECTURE §4 and returns typed errors. | M | pytest route tests |
| API-2 | Grounding uses the strict JSON schema in ARCHITECTURE §5.3; non-conforming or unparsable output is retried once, then returns 502 `model_error`. | M | pytest with respx-mocked API |
| API-3 | Post-processing clamps, normalises, converts to pixels and applies the honesty gate exactly as ARCHITECTURE §5.4. | M | pytest table-driven tests incl. out-of-range (1001), inverted boxes, point outside box, degenerate boxes |
| API-4 | `/v1/refine` uses a SAM 3.1 box prompt, decodes the mask to an SVG path, and applies the agreement check (ARCHITECTURE §6); any SAM failure returns `{"mode": "box"}` within 4 s. | M | pytest with recorded SAM responses |
| API-5 | 429 from Meta is retried with exponential backoff and jitter, honouring `Retry-After`, max 3 tries. | M | pytest |
| API-6 | Per-IP rate limits and a global daily and total spend cap are enforced; over-limit returns 429 / 503 with a human message. | M | pytest |
| API-7 | Every `/v1/step` and `/v1/refine` response includes `timings_ms` and `cost_usd` computed from usage tokens and the price table (`/v1/healthz` exempt). | M | pytest |
| API-8 | OpenAPI schema is exported and the TS client is generated from it in CI; drift fails CI. | M | CI step |
| API-9 | `/internal/purge` rejects a missing or wrong `X-Cron-Secret` with 401 and deletes nothing. | M | pytest |

## Eval

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| EVAL-1 | `make eval SUITE=all` reproduces every headline number from a clean clone given only `MODEL_API_KEY`. | M | Dry run on Day 8 from a fresh clone |
| EVAL-2 | Eval imports `showme.core` and uses the production prompt, schema, post-processing and image preprocessing. | M | Import check test; code review |
| EVAL-3 | Reports click accuracy by platform and element type (v2) and by group and ui_type (Pro). | M | report.md |
| EVAL-4 | Reports ablation: highlight IoU with model box vs SAM (agreement-gated); click accuracy unchanged by SAM is stated explicitly. | M | report.md |
| EVAL-5 | Reports latency p50/p95 and cost per step from real usage. | M | report.md |
| EVAL-6 | Reports honesty on the negatives suite and confidence calibration (AUROC, reliability bins). | M | report.md |
| EVAL-7 | Every reported number links to a `predictions.jsonl` with the raw request/response per sample. | M | report.md links |
| EVAL-8 | 20-task E2E suite with success predicates; success rate and average steps; redacted screenshot trail saved. | M | `make e2e` |
| EVAL-9 | Prompt tuning only on the dev split; headline numbers exclude it. | M | runner refuses `--split dev` for headline reports |

## Accessibility (WCAG 2.2 AA for our own UI)

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| A11Y-1 | Base font size 18 px, instruction text ≥ 24 px; UI usable at 200% zoom. | M | Playwright at 200% zoom |
| A11Y-2 | Contrast ≥ 4.5:1 for text, ≥ 3:1 for the highlight ring against both light and dark screenshots (dual-stroke ring). | M | axe + manual check |
| A11Y-3 | Every action reachable by keyboard with visible focus; logical tab order. | M | Playwright keyboard-only run |
| A11Y-4 | New instructions announced via `aria-live="polite"`; status changes announced. | M | axe + screen reader smoke test (VoiceOver) |
| A11Y-5 | `prefers-reduced-motion` disables pulse animations. | M | Playwright emulation |
| A11Y-6 | High-contrast mode toggle persists for the tab only. | M | Playwright |
| A11Y-7 | Touch targets ≥ 44x44 px. | M | Playwright layout check |

## Product surface

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| WEB-1 | Landing page with hero, how it works, privacy promise, live eval numbers from `RESULTS.md`, demo video, "for business" section. | M | Playwright + Lighthouse ≥ 90 performance and accessibility |
| WEB-2 | `/eval` page renders the latest `RESULTS.md`. | M | Playwright |
| WEB-3 | Public URL live by end of Day 4 (Oct 30). | M | PHASES Day 4 DoD |
| WEB-4 | Embeddable widget demo page for the business story. | S | manual |

## Engineering

| ID | Requirement | Pri | Verified by |
| --- | --- | --- | --- |
| ENG-1 | `make setup && make dev` runs web + API locally; `docker compose up` runs the API. | M | Fresh-clone dry run |
| ENG-2 | CI on every push: lint, type-check, unit tests (web + backend), OpenAPI drift, gitleaks, Docker build. | M | GitHub Actions |
| ENG-3 | Unit tests exist for the grounding parser/post-processing, SAM wrapper, redaction patterns and canvas encoding, and every API route. | M | CI coverage report (no % target; each listed module has tests) |
| ENG-4 | README: what, why, demo, architecture diagram, one-command setup, eval reproduction, privacy, limitations, licence. | M | Review on Day 8 |
