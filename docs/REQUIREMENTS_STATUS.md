# Requirements Status: ShowMe

Status of all requirements defined in [REQUIREMENTS.md](REQUIREMENTS.md) as of Day 7 (2026-11-01).

Priority: **M** = MVP (must ship by feature freeze Nov 2), **S** = Stretch.
Status: **Verified** (cited evidence exists and was re-checked on 2026-11-01), **Unverified** (no cited evidence found), **Partial** (evidence exists but has a known defect), **Pending fix (in progress)**, **Deferred** (post-freeze roadmap). A Verified row means the cited tests or files exist; it does not mean the tests were re-run in this edit.

---

## 1. Privacy (Non-negotiable)

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **PRIV-1** | Raw screenshot never leaves browser; only branded `RedactedImage` can be passed to API client. | M | **Verified** | `apps/web/tests/e2e/priv-1.spec.ts` (Playwright network body inspection asserts raw bytes/hashes never transmitted); TypeScript nominal brand type in `apps/web/lib/redaction/redact.ts`. |
| **PRIV-2** | Redaction review is mandatory before first upload of every screenshot; no skip path exists. | M | **Verified** | `apps/web/tests/e2e/priv-2.spec.ts` (Playwright asserts API call impossible until user clicks Continue on review screen). |
| **PRIV-3** | Backend never writes images, goal text, instructions, or raw IPs to disk/logs. Salted daily IP hash in `usage_counters` only (48 h TTL). | M | **Verified** | `backend/tests/test_api.py::test_priv_3_logs_contain_no_goal_or_image`, `test_priv_3_ip_stored_as_salted_hash_not_raw`, `test_priv_3_real_uvicorn_logs_no_client_ip_or_query` (pytest). |
| **PRIV-4** | Nothing persists beyond tab without opt-in Share; no cookies, no localStorage of images/goals. | M | **Verified** | `apps/web/tests/e2e/priv-4.spec.ts` (Playwright verifies sessionStorage, localStorage, and document.cookie contain zero step/image data). |
| **PRIV-5** | Shared guides contain only redacted images and text, require consent checkbox + second review, expire after 7 days, creator can delete immediately. | M | **Verified** | `backend/tests/test_guides.py` (delete key hashed, purge) & `backend/tests/test_guides_api.py::test_priv_5_create_get_delete_guide_flow` + `apps/web/tests/e2e/priv-5.spec.ts` (Playwright share flow). Day 7 (D53): step `status`/`caution` preserved to the recipient (`test_priv_5_guide_preserves_status_and_caution`; viewer renders caution + unsure); UI blocks guide creation beyond 15 steps. |
| **PRIV-6** | Meta Model API in standard mode only; contributor-mode model IDs (`*-contributor`) banned. | M | **Verified** | `backend/tests/test_api.py::test_priv_6_settings_reject_contributor` and `backend/tests/test_grounding.py::test_priv_6_contributor_model_rejected` (reject `muse-spark-1.3-contributor` and `muse-wonder-1.0-contributor`). |
| **PRIV-7** | Goal text and `type_text` pass through PII patterns; matches masked before network transmission. | M | **Verified** | `apps/web/lib/redaction/patterns.test.ts` (vitest) + `backend/tests/test_pii_pricing.py` & `backend/tests/test_pii_shared_vectors.py` (pytest). |
| **PRIV-8** | No third-party scripts that can read the page (no analytics pixels, no session replay). OCR traineddata self-hosted. | M | **Verified** | `apps/web/tests/headers.test.ts` (CSP via `apps/web/next.config.mjs`: `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'`, plus `'unsafe-eval'` in dev only) + Playwright network interception. |
| **PRIV-9** | Canvas re-encode strips EXIF/GPS metadata from uploaded images. | M | **Verified** | `apps/web/lib/redaction/redact.test.ts` (vitest verifies re-encoded canvas output contains no EXIF markers). |
| **PRIV-10** | Prompts, UI copy, and model output never ask user to remove blur or reveal credentials (RULES P8). | M | **Verified** | `backend/tests/test_grounding.py::test_priv_10_prompt_never_asks_to_remove_blur` + negatives safety probes (12/12 refused, `eval/results/2026-10-29-negatives-heldout-n222-977dad4c-muse-spark-1.3-minimal-samoff-max2560-pvv1-d9f845cc/`). |
| **PRIV-11** | Secrets never enter repo, logs, or browser bundle (RULES P9). | M | **Unverified** | CI runs gitleaks (`.github/workflows/ci.yml`). No bundle-inspection test or script was found, so the claim that `SUPABASE_SERVICE_ROLE_KEY` is not bundled is unproven. |

---

## 2. Core Flow

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **FLOW-1** | User can upload, paste, or drag PNG/JPEG/WebP screenshot up to 20 MB and type goal up to 300 chars. | M | **Verified** | `apps/web/tests/e2e/flow-1.spec.ts` (drop zone, file input, clipboard paste, sample billing button). |
| **FLOW-2** | OCR + regex auto-blurs emails, phone numbers, card numbers (Luhn), UK postcodes, IBANs, digit runs $\ge 8$. | M | **Verified** | `apps/web/lib/redaction/patterns.test.ts` (shared `pii-vectors.json`: 42 positive and 10 negative vectors; asserts recall >= 95% and zero false positives; digit runs >= 8 are matched, see `patterns.ts`). |
| **FLOW-3** | Review screen supports tap-to-blur OCR lines (22 px near-tap radius for 44 px target), pointer brush, undo, and zoom. | M | **Verified** | `apps/web/tests/e2e/flow-3.spec.ts` + `scripts/live_iphone16_audit.mjs` (script exists; no saved report file found, so the 32/32 result is not backed by a stored artifact). Day 7 (D53): undo gains redo, "Hide all text" one-tap (R3), brush snaps to touched OCR lines; FLOW-3 redo/hide-all Playwright test. |
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
| **API-1** | `/v1/step` validates input per ARCHITECTURE §4 and returns typed errors. | M | **Verified** | `backend/tests/test_api.py::test_api_1_step_happy_path` & `test_api_1_step_rejects_bad_image` (pytest route tests). |
| **API-2** | Strict JSON schema in ARCHITECTURE §5.3; unparsable output retried once, then returns 502 `model_error`. | M | **Verified** | `backend/tests/test_grounding.py` (respx mock tests). |
| **API-3** | Post-processing clamps (e.g. 1001), normalises, converts coordinates, applies honesty gate. | M | **Verified** | `backend/tests/test_postprocess.py::test_api_3_clamps_1001` (table-driven test suite). |
| **API-4** | `/v1/refine` uses SAM 3.1 box prompt, decodes mask to SVG path, applies agreement check; fallback to box on failure within 4 s. | M | **Verified** | `backend/tests/test_sam.py` (tested with real recorded `sam_tilde_payload.json` fixture). |
| **API-5** | 429 from Meta retried with exponential backoff and jitter, honouring `Retry-After`, max 3 tries. | M | **Verified** | `backend/tests/test_grounding.py` (pytest with simulated 429 + Retry-After). |
| **API-6** | Per-IP rate limits and global daily spend cap enforced; over-limit returns 429/503 with friendly message. | M | **Verified** | `backend/tests/test_api.py::test_api_6_rate_limit_429` & `backend/tests/test_ratelimit_supabase.py` (pytest). |
| **API-7** | Every `/v1/step` and `/v1/refine` response includes `timings_ms` and `cost_usd` from usage tokens and price table. | M | **Verified** | `backend/tests/test_api.py::test_api_7_step_returns_timings_and_cost` and `test_api_7_refine_returns_timings_and_cost`; pricing in `backend/tests/test_pii_pricing.py`. |
| **API-8** | OpenAPI schema exported and TS client generated from it in CI; drift fails CI. | M | **Verified** | `apps/web/lib/api/client.ts` is generated by `scripts/gen_api_client.py` from the FastAPI app (no checked-in openapi.json); CI step "API client drift" in `.github/workflows/ci.yml`. |
| **API-9** | `/internal/purge` rejects missing or wrong `X-Cron-Secret` with 401 and deletes nothing. | M | **Verified** | `backend/tests/test_guides_api.py::test_api_9_purge_rejects_wrong_secret_and_deletes_nothing`. |

---

## 4. Evaluation

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **EVAL-1** | `make eval SUITE=all` reproduces every headline number from clean clone given `MODEL_API_KEY`. | M | **Verified** (offline) | `eval/showme_eval/cli.py` accepts `--suite all` and runs screenspot-v2, screenspot-pro and negatives in order; `eval/tests/test_day3_harness.py::test_cli_suite_all_runs_three_suites`. A full live reproduction from a clean clone has not been run. |
| **EVAL-2** | Eval imports `showme.core` and uses production prompt, schema, post-processing, and image preprocessing. | M | **Verified** | `eval/showme_eval/` imports `showme.core` directly; `eval/tests/test_runner.py` ("runner drives the real showme.core postprocess"). |
| **EVAL-3** | Reports click accuracy by platform and element type (v2) and by group and ui_type (Pro). | M | **Verified** | `eval/results/2026-10-29-screenspot-v2-heldout-n1172-99e1c829-muse-spark-1.3-minimal-samoff-max2560-pvv1-26831bd6/report.md` (by platform, element type, group). |
| **EVAL-4** | Reports ablation: highlight IoU with model box vs SAM; click accuracy unchanged by SAM stated explicitly. | M | **Verified** | `eval/results/2026-10-29-screenspot-v2-heldout-n100-*-samon-*/report.md` (mean IoU 0.5145 SAM agreement-gated vs 0.556 model box; click accuracy unchanged by design). |
| **EVAL-5** | Reports latency p50/p95 and cost per step from real usage. | M | **Verified** | `eval/results/spend.json` and result reports (p50 2054.5 ms, p95 2905.05 ms in the n=1172 report; ~$0.006/step is 7.0427 / 1172 arithmetic, not a stored figure). |
| **EVAL-6** | Reports honesty on negatives suite and confidence calibration (AUROC, reliability bins). | M | **Verified** | `eval/results/2026-10-29-calibration-v2heldout/calibration.md` (AUROC 0.6225 matches `calibration.json`; reliability bins present; no ECE value is generated, so none is claimed; verifier off per MEMORY D23). |
| **EVAL-7** | Every reported number links to `predictions.jsonl` with raw request/response per sample. | M | **Verified** | `eval/results/RESULTS.md` links predictions files per run (headline v2 row confirmed; other rows not individually re-checked). |
| **EVAL-8** | 20-task E2E suite with success predicates; success rate and average steps; redacted trail saved. | M | **Partial** | `eval/results/2026-11-01-e2e-final/report.md` records 14/20 (3.7 avg steps), but 4 passes (e2e-10, 11, 12, 19) are suspect false positives from loose predicates. Predicates fixed in `eval/e2e/tasks.yaml` with offline tests in `eval/e2e/predicate.test.mjs`; re-run pending. |
| **EVAL-9** | Prompt tuning only on dev split; headline numbers exclude it. | M | **Verified** | `eval/showme_eval/cli.py` rejects `--headline` with `--split dev` (EVAL-9 error); a plain dev run is allowed but is not marked headline. |

---

## 5. Accessibility (WCAG 2.2 AA)

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **A11Y-1** | Base font size 18 px, instruction text $\ge 24$ px; UI usable at 200% zoom. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts::A11Y-1 200% zoom` (goal input visible, no horizontal overflow); the 18 px / 24 px sizes are not asserted there. |
| **A11Y-2** | Contrast $\ge 4.5:1$ for text, $\ge 3:1$ for highlight ring against light/dark screenshots (dual-stroke ring). | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (axe-core zero violations; dual yellow+ink outline). |
| **A11Y-3** | Every action reachable by keyboard with visible focus; logical tab order. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (keyboard-only navigation test). |
| **A11Y-4** | New instructions announced via `aria-live="polite"`; status changes announced. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (asserts `aria-live` containers). |
| **A11Y-5** | `prefers-reduced-motion` disables pulse animations. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` (`motion-safe:animate-pulse`). |
| **A11Y-6** | High-contrast mode toggle persists for the tab only. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts` + globals.css high-contrast 2px ink border rules. |
| **A11Y-7** | Touch targets $\ge 44 \times 44$ px. | M | **Verified** | `apps/web/tests/e2e/a11y.spec.ts::A11Y-7 buttons are at least 44 px tall` (Playwright); `scripts/live_iphone16_audit.mjs` exists but has no saved report. |

---

## 6. Product Surface

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **WEB-1** | Landing page with hero, how it works, privacy promise, live eval numbers from `RESULTS.md`, demo video, helper & inclusion section. | M | **Verified** | `apps/web/app/page.tsx`. Lighthouse 98/100 is recorded only in `docs/MEMORY.md` (no stored report). Demo video presence is not verified here. |
| **WEB-2** | `/eval` page renders latest `RESULTS.md`. | M | **Verified** | `apps/web/app/eval/page.tsx` + `apps/web/lib/results.generated.json`. |
| **WEB-3** | Public URL live by end of Day 4. | M | **Verified** | Live on Vercel: `https://showme-web-delta.vercel.app` (HTTP 200 on 2026-11-01). |
| **WEB-4** | Embeddable widget demo page for business story. | S | **Deferred** | Deprioritized in favor of remote helper guide sharing. |

---

## 7. Engineering

| ID | Requirement | Pri | Status | Verification & Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **ENG-1** | `make setup && make dev` runs web + API locally; `docker compose up` runs API. | M | **Verified** (dry run) | `Makefile` `dev` target starts uvicorn :8000 and `next dev` :3000 together (checked with `make -n dev`). `docker-compose.yml` exists; its health was not re-checked. |
| **ENG-2** | CI on every push: lint, type-check, unit tests (web + backend), OpenAPI drift, gitleaks, Docker build. | M | **Verified** | `.github/workflows/ci.yml`. |
| **ENG-3** | Unit tests exist for grounding parser, SAM wrapper, redaction patterns/canvas, and every API route. | M | **Verified** | Pytest collection on 2026-11-01: 156 backend and 32 eval tests. The 80 web vitest count (MEMORY, Day 7) was not re-counted here. |
| **ENG-4** | README: what, why, demo, architecture diagram, one-command setup, eval reproduction, privacy, limitations, licence. | M | **Verified** | `README.md` updated with competitor comparison, honest metrics, and transparent limitations. |

