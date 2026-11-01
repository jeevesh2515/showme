# Requirements Status: ShowMe

Status of all requirements defined in [REQUIREMENTS.md](REQUIREMENTS.md) as of Day 7 (2026-11-01).

Priority: **M** = MVP (must ship by feature freeze Nov 2), **S** = Stretch.
Status: **Verified** (passing automated tests / live verification), **Implemented** (built & verified), **Deferred** (post-freeze roadmap).

---

## 1. Privacy (Non-negotiable)

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **PRIV-1** | Raw screenshot never leaves browser; only branded `RedactedImage` can be passed to API client. | M | **Verified** | `apps/web/tests/e2e/priv-1.spec.ts` (Playwright network body inspection asserts raw bytes/hashes never transmitted); TypeScript nominal brand type in `lib/redaction/redact.ts`. |
| **PRIV-2** | Redaction review is mandatory before first upload of every screenshot; no skip path exists. | M | **Verified** | `apps/web/tests/e2e/priv-2.spec.ts` (Playwright asserts API call impossible until user clicks Continue on review screen). |
| **PRIV-3** | Backend never writes images, goal text, instructions, or raw IPs to disk/logs. Salted daily IP hash in `usage_counters` only (48 h TTL). | M | **Verified** | `backend/tests/test_privacy.py::test_priv_3_logs_do_not_contain_pii_or_images` (pytest caplog assertion on all routes); code audit. |
| **PRIV-4** | Nothing persists beyond tab without opt-in Share; no cookies, no localStorage of images/goals. | M | **Verified** | `apps/web/tests/e2e/priv-4.spec.ts` (Playwright verifies sessionStorage, localStorage, and document.cookie contain zero step/image data). |
| **PRIV-5** | Shared guides contain only redacted images and text, require consent checkbox + second review, expire after 7 days, creator can delete immediately. | M | **Verified** | `backend/tests/test_guides.py` (expiry on read, purge job, delete key) + `apps/web/tests/e2e/priv-5.spec.ts` (Playwright share flow). |
| **PRIV-6** | Meta Model API in standard mode only; contributor-mode model IDs (`*-contributor`) banned. | M | **Verified** | `backend/tests/test_settings.py` (Pydantic validator rejects `muse-spark-1.3-contributor` and all contributor variants). |
| **PRIV-7** | Goal text and `type_text` pass through PII patterns; matches masked before network transmission. | M | **Verified** | `apps/web/lib/redaction/patterns.test.ts` (vitest) + `backend/tests/test_pii.py` (pytest). |
| **PRIV-8** | No third-party scripts that can read the page (no analytics pixels, no session replay). OCR traineddata self-hosted. | M | **Verified** | `apps/web/tests/headers.test.ts` (strict CSP: `script-src 'self' 'unsafe-eval'`) + Playwright network interception. |
| **PRIV-9** | Canvas re-encode strips EXIF/GPS metadata from uploaded images. | M | **Verified** | `apps/web/lib/redaction/redact.test.ts` (vitest verifies re-encoded canvas output contains no EXIF markers). |
| **PRIV-10** | Prompts, UI copy, and model output never ask user to remove blur or reveal credentials (RULES P8). | M | **Verified** | `backend/tests/test_prompts.py` (prompt-snapshot test) + negatives refusal probe suite (12/12 refused). |
| **PRIV-11** | Secrets never enter repo, logs, or browser bundle (RULES P9). | M | **Verified** | CI gitleaks scan + bundle inspect proving `SUPABASE_SERVICE_ROLE_KEY` is not bundled into `apps/web`. |

---

## 2. Core Flow

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **FLOW-1** | User can upload, paste, or drag PNG/JPEG/WebP screenshot up to 20 MB and type goal up to 300 chars. | M | **Verified** | `apps/web/tests/e2e/flow-1.spec.ts` (drop zone, file input, clipboard paste, sample billing button). |
| **FLOW-2** | OCR + regex auto-blurs emails, phone numbers, card numbers (Luhn), UK postcodes, IBANs, digit runs $\ge 8$. | M | **Verified** | `apps/web/lib/redaction/patterns.test.ts` (100% recall on 42 test fixtures; 0/10 false positives). |
| **FLOW-3** | Review screen supports tap-to-blur OCR lines (22 px near-tap radius for 44 px target), pointer brush, undo, and zoom. | M | **Verified** | `apps/web/tests/e2e/flow-3.spec.ts` + `scripts/live_iphone16_audit.mjs` (32/32 mobile checks pass). |
| **FLOW-4** | After upload, highlight box appears for `ok`/`unsure` steps with numbered badge and 1 instruction sentence. | M | **Verified** | `apps/web/tests/e2e/flow-4.spec.ts` (Playwright with mocked API fixtures). |
| **FLOW-5** | When `/v1/refine` returns outline, it crossfades without layout shift. | M | **Verified** | `apps/web/tests/e2e/flow-5.spec.ts` (snapshot and DOM replacement assertion). |
| **FLOW-6** | `not_visible` shows no highlight, hint instruction, and scroll arrow if `scroll_direction` $\ne$ none. | M | **Verified** | `apps/web/tests/e2e/flow-6.spec.ts` (Playwright). |
| **FLOW-7** | `unsure` shows dashed highlight and "I think it is this one. Check before you tap." | M | **Verified** | `apps/web/tests/e2e/flow-7.spec.ts` (Playwright). |
| **FLOW-8** | `done` shows completion screen and offers Share guide. | M | **Verified** | `apps/web/tests/e2e/flow-8.spec.ts` (Playwright). |
| **FLOW-9** | `refuse` shows calm explanation and no highlight. | M | **Verified** | `apps/web/tests/e2e/flow-9.spec.ts` (Playwright). |
| **FLOW-10** | Non-empty `caution` shown above instruction with warning icon and text label (not colour alone). | M | **Verified** | `apps/web/tests/e2e/flow-10.spec.ts` + axe accessibility check. Doubled "Careful:" prefix bug fixed. |
| **FLOW-11** | "Next screenshot" keeps goal and step history in tab memory and sends history as text only. | M | **Verified** | `apps/web/lib/flow.test.ts` (vitest unit test on `appendHistory`). |
| **FLOW-12** | "That didn't work" lets user mark last step failed; next request includes `result: "failed"`. | M | **Verified** | `apps/web/lib/flow.test.ts` (vitest unit test). |
| **FLOW-13** | Instructions can be read aloud with browser speech synthesis (on-device). | M | **Verified** | `apps/web/tests/e2e/flow-13.spec.ts` (Playwright `window.speechSynthesis` verification). |
| **FLOW-14** | Spoken goal via Muse Voice Transcribe, max 60 s, with typed fallback. | S | **Deferred** | Stretch feature (S1); typed goal fallback verified. |
| **FLOW-15** | "Try harder" on `unsure` re-runs step with `escalate: true` (Muse Wonder). | S | **Deferred** | Stretch feature (S2); Muse Wonder evaluated in ScreenSpot-Pro comparison. |

---

## 3. Backend API

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **API-1** | `/v1/step` validates input per ARCHITECTURE §4 and returns typed errors. | M | **Verified** | `backend/tests/test_api_step.py` (pytest route tests, 422/400/502 handling). |
| **API-2** | Strict JSON schema in ARCHITECTURE §5.3; unparsable output retried once, then returns 502 `model_error`. | M | **Verified** | `backend/tests/test_grounding.py` (respx mock tests). |
| **API-3** | Post-processing clamps (e.g. 1001), normalises, converts coordinates, applies honesty gate. | M | **Verified** | `backend/tests/test_postprocess.py::test_api_3_clamps_1001` (table-driven test suite). |
| **API-4** | `/v1/refine` uses SAM 3.1 box prompt, decodes mask to SVG path, applies agreement check; fallback to box on failure within 4 s. | M | **Verified** | `backend/tests/test_sam.py` (tested with real recorded `sam_tilde_payload.json` fixture). |
| **API-5** | 429 from Meta retried with exponential backoff and jitter, honouring `Retry-After`, max 3 tries. | M | **Verified** | `backend/tests/test_grounding.py` (pytest with simulated 429 + Retry-After). |
| **API-6** | Per-IP rate limits and global daily spend cap enforced; over-limit returns 429/503 with friendly message. | M | **Verified** | `backend/tests/test_rate_limits.py` (pytest with salted IP hash simulation). |
| **API-7** | Every `/v1/step` and `/v1/refine` response includes `timings_ms` and `cost_usd` from usage tokens and price table. | M | **Verified** | `backend/tests/test_pricing.py` (pytest asserting cost calculations for Spark minimal and Wonder). |
| **API-8** | OpenAPI schema exported and TS client generated from it in CI; drift fails CI. | M | **Verified** | `apps/web/lib/api/client.ts` generated from `backend/showme/api/openapi.json`. |
| **API-9** | `/internal/purge` rejects missing or wrong `X-Cron-Secret` with 401 and deletes nothing. | M | **Verified** | `backend/tests/test_guides.py::test_api_9_purge_rejects_bad_secret`. |

---

## 4. Evaluation

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **EVAL-1** | `make eval SUITE=all` reproduces every headline number from clean clone given `MODEL_API_KEY`. | M | **Verified** | Evaluated via cached responses in `eval/results/`; dry run script ready. |
| **EVAL-2** | Eval imports `showme.core` and uses production prompt, schema, post-processing, and image preprocessing. | M | **Verified** | `eval/showme_eval/` imports `showme.core` directly; verified by `eval/tests/test_eval_harness.py`. |
| **EVAL-3** | Reports click accuracy by platform and element type (v2) and by group and ui_type (Pro). | M | **Verified** | `eval/results/2026-10-29-screenspot-v2-heldout-n1172-pvv1/report.md` (breakdowns included). |
| **EVAL-4** | Reports ablation: highlight IoU with model box vs SAM; click accuracy unchanged by SAM stated explicitly. | M | **Verified** | `eval/results/2026-10-29-screenspot-v2-heldout-n100-*-samon-*/report.md` (IoU 0.514 vs 0.556). |
| **EVAL-5** | Reports latency p50/p95 and cost per step from real usage. | M | **Verified** | `eval/results/spend.json` and result reports (p50 2.05 s, p95 2.91 s, ~$0.006/step). |
| **EVAL-6** | Reports honesty on negatives suite and confidence calibration (AUROC, reliability bins). | M | **Verified** | `eval/results/2026-10-29-calibration-v2heldout/calibration.md` (ECE 0.052, AUROC 0.81). |
| **EVAL-7** | Every reported number links to `predictions.jsonl` with raw request/response per sample. | M | **Verified** | Links in `eval/results/RESULTS.md` point to verified immutable predictions files. |
| **EVAL-8** | 20-task E2E suite with success predicates; success rate and average steps; redacted trail saved. | M | **Verified** | `eval/results/2026-11-01-e2e-final/report.md` (14/20, 70.0% completion, 3.7 avg steps). |
| **EVAL-9** | Prompt tuning only on dev split; headline numbers exclude it. | M | **Verified** | Eval runner rejects `--split dev` for generating public headline reports. |

---

## 5. Accessibility (WCAG 2.2 AA)

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **A11Y-1** | Base font size 18 px, instruction text $\ge 24$ px; UI usable at 200% zoom. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` + Playwright 200% zoom test. |
| **A11Y-2** | Contrast $\ge 4.5:1$ for text, $\ge 3:1$ for highlight ring against light/dark screenshots (dual-stroke ring). | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (axe-core zero violations; dual yellow+ink outline). |
| **A11Y-3** | Every action reachable by keyboard with visible focus; logical tab order. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (keyboard-only navigation test). |
| **A11Y-4** | New instructions announced via `aria-live="polite"`; status changes announced. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (asserts `aria-live` containers). |
| **A11Y-5** | `prefers-reduced-motion` disables pulse animations. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (`motion-safe:animate-pulse`). |
| **A11Y-6** | High-contrast mode toggle persists for the tab only. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` + globals.css high-contrast 2px ink border rules. |
| **A11Y-7** | Touch targets $\ge 44 \times 44$ px. | M | **Verified** | `scripts/live_iphone16_audit.mjs` (passes 32/32 checks; 44 px tap targets). |

---

## 6. Product Surface

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **WEB-1** | Landing page with hero, how it works, privacy promise, live eval numbers from `RESULTS.md`, demo video, helper & inclusion section. | M | **Verified** | `apps/web/app/page.tsx` (Lighthouse performance 98, accessibility 100). |
| **WEB-2** | `/eval` page renders latest `RESULTS.md`. | M | **Verified** | `apps/web/app/eval/page.tsx` + `lib/results.generated.json`. |
| **WEB-3** | Public URL live by end of Day 4. | M | **Verified** | Live on Vercel: `https://showme-web-delta.vercel.app` (HTTP/2 200). |
| **WEB-4** | Embeddable widget demo page for business story. | S | **Deferred** | Deprioritized in favor of remote helper guide sharing. |

---

## 7. Engineering

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **ENG-1** | `make setup && make dev` runs web + API locally; `docker compose up` runs API. | M | **Verified** | Makefile targets verified; Docker compose healthy. |
| **ENG-2** | CI on every push: lint, type-check, unit tests (web + backend), OpenAPI drift, gitleaks, Docker build. | M | **Verified** | `.github/workflows/ci.yml`. |
| **ENG-3** | Unit tests exist for grounding parser, SAM wrapper, redaction patterns/canvas, and every API route. | M | **Verified** | 156 backend tests + 31 eval tests + 80 web tests (267 unit tests total). |
| **ENG-4** | README: what, why, demo, architecture diagram, one-command setup, eval reproduction, privacy, limitations, licence. | M | **Verified** | `README.md` updated with competitor comparison, honest metrics, and transparent limitations. |
