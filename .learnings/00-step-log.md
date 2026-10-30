# Step log

Chronological record of every step taken on ShowMe: what was done, why, what the evidence showed, and what changed as a result. Newest entries at the bottom. Each entry links to the evidence so any claim can be re-checked.

Format per entry: **Step**, **Why**, **What I did**, **Result / evidence**, **Decision it drove**.

---

## 2026-10-27 · S0 · Repo bootstrap

- **Why:** Start from an empty folder so every line of code is written during the hackathon (rule: no copying from previous repos).
- **What I did:** Ran `/init`. The folder held only an empty `README.md`; no git repo.
- **Result:** Placeholder `CLAUDE.md` created. Later replaced by the agent guide that points at `/docs`.
- **Decision:** All planning docs live in `/docs`; all learning notes live in `.learnings/`; throwaway verification code lives in `spikes/` and never ships.

## 2026-10-27 · S1 · Environment check

- **Why:** The plan has to fit the machine and the £0 budget.
- **What I did:** Checked toolchain and API key env vars (names only, never values).
- **Result:** Apple M5, 16 GB RAM. Python 3.11.15, Node 22.22.3, pnpm 10.19, uv 0.11, Docker 29.8, gh 2.98, tesseract 5.5.2. No Meta API key, no Hugging Face login, no Modal/Baseten/Fireworks keys in the environment.
- **Decision:** Spikes that need the Meta API key (grounding smoke test) or gated weights (SAM 3.x) are blocked on the founder. Everything else runs locally now.

## 2026-10-27 · S2 · Parallel research (Meta Model API, SAM 3.1, ScreenSpot)

- **Why:** Spike (a) and the eval design depend on public facts that may have changed after the model knowledge cutoff. Verify from official sources instead of memory.
- **What I did:** Three research subagents in parallel: Meta Model API + hackathon rules (Sonnet), SAM 3.1 availability + hosting (Sonnet), ScreenSpot v1/v2/Pro datasets (Haiku). Each had to cite a URL per claim and mark anything unconfirmed as UNVERIFIED.
- **Result:** See `docs/SPIKES.md` sections (a), (b), (c).

## 2026-10-27 · S3 · Spike (d): client-side redaction

- **Why:** Privacy is a hard requirement: the raw screenshot must never leave the browser. If OCR-based redaction is too slow or misses PII, the whole product promise breaks, so test it before planning around it.
- **What I did:**
  1. Wrote 3 fixture pages with known fake PII (`spikes/redaction/fixtures/*.html`): a light desktop billing page, a 3x-density mobile login, a 2x dark-mode settings page.
  2. Rendered them with headless Chrome to PNG (1280x800, 1170x2532, 2560x1440).
  3. `spikes/redaction/run.mjs`: tesseract.js 5.1.1 (the same WASM engine that runs in the browser) → word boxes → regex for email, phone (9 to 15 digits), card (13 to 19 digits plus Luhn check) → black boxes over matched words.
  4. `spikes/redaction/run_inputs.mjs`: a pixel heuristic to find text inside input fields (names, addresses).
- **Result:**
  - Regex layer: 10/10 PII strings found, 0 false positives, OCR 154 to 375 ms per image on the M5 in Node. Redacted images: `spikes/redaction/fixtures/*_redacted.png`.
  - Input-field heuristic: 7/11 recall, 6 false positives (field labels), 0/3 on dark mode. Not reliable.
  - Known gap: free text inside inputs (names like "Maria Okafor", street addresses, CVC) is not caught by regex.
- **Decision:** MVP redaction = regex layer + mandatory review screen with a manual blur brush and one-tap "blur this field". Pixel input detection moves to stretch. Fixtures are synthetic and clean, so real-world recall will be lower: the review screen is not optional.

## 2026-10-27 · S4 · Spike (c), local stand-in: SAM 2.1 tiny

- **Why:** SAM 3 / 3.1 weights on Hugging Face are gated (access request), so I tested the same click-to-mask idea with Meta's open SAM 2.1 tiny (Apache-2.0) to learn how SAM behaves on flat UI before the API was available.
- **What I did:** `spikes/sam/run.py` (centre clicks on 6 UI elements), `jitter.py` (8 random clicks per element), `policies.py` (which of SAM's 3 candidate masks to pick), `screenspot_sam.py` (near-miss clicks on 10 real ScreenSpot screenshots).
- **Result:** centre clicks IoU 0.77 to 0.99, 209 ms warm on Apple MPS. Off-centre clicks: my first selection policy ("largest candidate") only got 17% whole-element; single-mask output got 88% (ceiling 90%). Near-miss clicks: point-in-box 38% raw vs 34% after refinement (helped 0, hurt 4).
- **Lesson:** `AutoModel` loads the SAM video model; the image click API needs `Sam2Model` / `Sam3TrackerModel`. And the big one: SAM cannot fix a click on the wrong element, it just segments the wrong element precisely.
- **Decision:** SAM is a highlight tool, not an accuracy tool. The ablation reports click accuracy and highlight quality separately.

## 2026-10-27 · S5 · Data for the grounding smoke test

- **Why:** Spike (b) needs real screenshots with ground truth, without downloading 600 MB+.
- **What I did:** `spikes/grounding/fetch_samples.py` pulls 10 stratified rows (4 mobile, 3 desktop, 3 web; text and icon) from ScreenSpot v1 via the Hugging Face datasets-server `/rows` API. The old id `rootsautomation/ScreenSpot` was renamed to `bevaya/ScreenSpot`; `/filter` timed out; rows are grouped by source, so I probed offsets; mobile rows are JPEG not PNG; added retries for sporadic 502s.
- **Result:** 10 images + `samples.json` with pixel xyxy boxes (dataset stores normalised xyxy).

## 2026-10-27 · S6 · Spike (b): grounding with the Meta Model API

- **Why:** The whole product depends on the model returning a correct point on a screenshot.
- **What I did:** Founder provided a Meta Model API key in `.env` ($150 credit). `spikes/grounding/smoke.py`: Chat Completions, strict JSON schema, 0 to 1000 grid (from Meta's image-understanding docs), temperature 0. Swept `reasoning_effort` (default, low, minimal) on `muse-spark-1.3` and ran `muse-wonder-1.0` at minimal. Added 5 absent-target probes.
- **Result:** Muse Spark 10/10 at every effort; minimal halves latency (p50 2,809 ms vs 5,485 ms) and cost (~$0.0051 per call). 5/5 honest "not visible". Muse Wonder also 10/10 and 5/5, p50 3,069 ms, ~3x cost. Confidence 0.95 to 0.98 on every hit: not useful as a signal.
- **Lesson:** strict mode needs `additionalProperties: false` on every object. Reasoning tokens are billed as output, so `minimal` effort is the cheap, fast default for a single-point task.
- **Decision:** D1 (Spark minimal default), D2 (Wonder as escalation), honesty needs a calibration step and possibly a verifier pass.

## 2026-10-27 · S7 · Spike (c) for real: SAM 3.1 through the Meta API

- **Why:** Research showed SAM 3.1 is served by the Meta Model API, so no hosting is needed and the hackathon's "use SAM 3.1" path is direct.
- **What I did:** `spikes/sam/api_sam.py` (Responses API, model `sam-3.1`, point prompts built with `meta-sam-parser`); `pipeline_preview.py` (Muse Spark → highlight via model box vs SAM point prompt vs SAM box prompt on 16 targets); decoded a mask to an SVG path.
- **Result:** 73% whole-element masks from off-centre clicks; p50 1,338 ms, p95 2,454 ms. Near-miss refinement 10/30 → 11/30. Highlight IoU vs ScreenSpot boxes: model box 0.57, SAM box prompt 0.51, SAM point prompt 0.41 (ScreenSpot boxes are often loose, which penalises tight masks; on synthetic UIs SAM won 3 of 5). Mask payload must keep its leading `!` marker or the parser rejects it.
- **Decision:** D3 (SAM via API), D4 (box prompt, agreement gate, never move the click), D5 (two-call step so the box shows first).

## 2026-10-27 · S8 · Planning docs

- **Why:** One source of truth that every agent and the founder follow daily.
- **What I did:** Wrote `docs/` SPIKES, PRD, REQUIREMENTS (IDs used by tests), ARCHITECTURE (contracts, prompt, schema, SAM, redaction, storage, hosting, eval), RULES (privacy P1 to P9, never fake a result), PHASES (Day 1 to 8 with DoD, freeze Nov 2), DESIGN (ink-and-highlighter identity, overlay, screens, demo script), MEMORY (decisions, assumptions, ranked questions), RISKS (8 risks with kill criteria). Rewrote `CLAUDE.md` as the agent entry point; `AGENTS.md` symlinks to it for other coding agents. Added `.gitignore` (protects `.env`).
- **Checks:** WCAG contrast ratios computed with a script, not from memory; Atkinson Hyperlegible Next confirmed on Google Fonts; cross-references between docs checked.
- **Decision:** D6 to D13 in MEMORY.md.

## 2026-10-27 · S9 · Interview Q&A

- **Why:** The founder must be able to explain every choice, number and limitation.
- **What I did:** A Sonnet subagent wrote `.learnings/01` to `10` from the docs only, tagging each answer as Measured, Decided, Planned, Hypothesis or Known limitation; then I verified the files against the docs.

## 2026-10-27 · S10 · Docs corrected, Q&A synced

- **Why:** The Q&A was written before a round of doc corrections, so some answers carried open notes that the docs had since settled.
- **What I did:** Re-read every doc and Q&A file. Updated the Q&A for the settled points: raw IPs never stored (only a salted daily hash for 48 h), prompt v1 not yet measured, Growth overage about 5x API cost, box shown after the grounding call, judging Nov 4 to 8 and ceremony Nov 9, R6 trigger as total account spend, solid-block redaction with postcodes, IBANs and digit runs tested on Day 3, self-hosted font, Muse Spark Open and the Benchmarks section in SPIKES, and Startup as a recommendation pending MEMORY Q3. Fixed wrong or missing references (a non-existent rule ID, a refine response shape, a retention open question).
- **Decision:** No product decision changed. Items that need the founder are listed in the verifier report.

## 2026-10-27 · S11 · Verifier follow-ups closed

- **Why:** The independent verifier left five items for the lead.
- **What I did:** Added the measured pipeline latency (p50 5,319 ms, max 7,677 ms with two SAM calls) and the 90% candidate ceiling to SPIKES.md so RISKS R4 and this log cite evidence; clarified that the R6 $110 trigger sits above the $107 plan, so reaching it means spend is off-plan; added `make smoke` to ARCHITECTURE and CLAUDE.md; settled keepalive on Vercel Cron (GitHub Actions schedule is the fallback).
- **Result:** No em or en dashes, all relative links resolve, every requirement ID cited exists. Plan is ready for founder approval; no application code written.

## 2026-10-27 · S12 · Daily agent prompt pack

- **Why:** The founder wants one copy-paste prompt per day, in sync with the plan, so any agent session starts with the same context, rules and definition of done, and the founder learns what was built each day.
- **What I did:** Wrote `docs/prompts/00-common.md` (session start protocol with a carry-over check, non-negotiables, spend control, skills, subagent rules, git, end-of-session duties including a daily founder briefing) and one prompt per date from Oct 28 to Nov 4, each split into phases with checks, a DoD, an API ceiling and founder tasks. Added real use-case evidence points: manual runs on public sites (Day 4), a 20-task E2E suite (Day 5), a usability test with real people (Day 6). Synced PHASES.md, RULES.md §7 and CLAUDE.md to point at the prompts; removed the superseded single prompt file.
- **Decision:** Feature freeze stays Nov 2 23:59; Nov 3 is regression, video and submission; Nov 4 is verify and submit by 18:00 London.

## 2026-10-27 · S13 · Kickoff audit loop + Day 1 close-out

- **Why:** Founder kicked off the project and required an independent score (gate 8.5/10) with a fix loop, Day 1 verified complete, and readiness for the next working day.
- **What I did:** Three internal subagent audits on disjoint briefs (docs consistency 7.0, privacy/security 5.5, eval evidence 6.0) plus two Meta API reviewers (`muse-spark-1.3` 7.6, `muse-wonder-1.0` 7.8; 2 calls, 8,192 prompt tokens each, ~$0.04). Recorded founder decisions D14-D16 (plan approved, Indie, public `showme` MIT, accounts/cap/story). Fixed confirmed findings across MEMORY, PHASES, ARCHITECTURE, REQUIREMENTS, RISKS, SPIKES, day-2 prompt, `.gitignore`, CLAUDE sync. Added persistent gate `scripts/score_gate.py` -> `docs/SCORE.md` + `.learnings/score-history.json`. `git init`, MIT LICENSE, public GitHub repo, first commit.
- **Result / evidence:** `docs/SCORE.md` (generated score), `.learnings/daily/2026-10-27.md` (fixed vs rejected/deferred findings with reasons).
- **Decision:** No fabricated spike logs (RULES section 2); gap disclosed in SPIKES.md. Day 2 starts from the filled-in `docs/prompts/day-2-oct-28.md`. Founder still owes Q4 (Official Rules) + credit expiry (Q6).

## 2026-10-28 · S14 · Backend core + API (Day 2)

- **Why:** Day 2 theme: production core path that both API and eval import (EVAL-2), so benchmark numbers measure the shipped code.
- **What I did:** Main agent built `showme/core` (prompts v1, strict schema, grounding with 429 backoff/Retry-After + one unparsable retry, postprocess §5.4, SAM refine, pricing, PII). Free-DeepSeek subagents built eval harness (`eval/`), Makefile/Docker/CI, and FastAPI layer on disjoint files; main integrated and reviewed.
- **Result / evidence:** 53 backend + 19 eval tests pass; `mypy --strict` on core clean; `docker compose up` healthz ok; live `/v1/step` on the synthetic billing fixture returned a valid step and `/v1/refine` a SAM outline. Live debugging found 3 real bugs (mask regex truncating `|` payloads, SAM H/W swap, 422 handler returning 500), each fixed with a regression test; real responses recorded under `backend/tests/fixtures/`.
- **Decision:** D21 (refine needs the same redaction attestation as step) after the security subagent flagged the missing gate.

## 2026-10-28 · S15 · ScreenSpot-v2 data + dev split

- **Why:** First real measurement of prompt v1; v2 size was UNVERIFIED.
- **What I did:** Downloaded v2 annotations + 1.33 GB image zip (all 730 unique images verified present), loaders drew GT boxes on desktop/mobile/web/Pro samples and I eyeballed them (boxes land on targets; xywh for v2, xyxy for Pro confirmed).
- **Result / evidence:** v2 = **1,272 samples**. `make smoke` 10/10. Dev-100 (seed 0): **93/100 at 2560 px** (desktop 94.7%, mobile 95.7%, web 88.2%; text 98.2%, icon 86.4%), p50 2,772 ms, files in `eval/results/2026-10-28-screenspot-v2-muse-spark-1.3-minimal-samoff-max2560/`.
- **Decision:** None yet on default model; held-out Day 3 decides (R1). Dev is not headline (EVAL-9).

## 2026-10-28 · S16 · A7 resolution sweep

- **Why:** A7: does the 1920 px cap hurt accuracy?
- **What I did:** Same dev-100 at 1920, native, 2560 (cache made the 2560 run cost $0.0605).
- **Result / evidence:** 1920 = 85.0%, native = 93.0%, 2560 = 93.0%; 9 mobile misses at 1920 become hits at native, 1 reverse. Reports in `eval/results/2026-10-28-*/report.md`.
- **Decision:** D20 — cap raised to 2560 everywhere (client spec, API validation, eval), ARCH updated same day.

## 2026-10-28 · S17 · Security + test review loop

- **Why:** Day 2 touched logging, settings, storage-adjacent code; 00-common requires security review on such days.
- **What I did:** Two read-only free-DeepSeek subagents (security, test coverage). Fixed all confirmed security findings; added the highest-value missing tests (504, schema-invalid retry, Retry-After sleep, daily/total caps, PRIV-7 end-to-end, SAM contains gate, refine log privacy).
- **Result / evidence:** `make lint test` green (53 + 19); gitleaks on tracked files finds only env-var-name false positives; `.env` untracked. Rejected findings recorded in MEMORY 2026-10-28 entry with reasons.
- **Decision:** No rule weakened; P3 salted-hash wording now actually implemented (date + `IP_HASH_SALT_SEED`).

## 2026-10-28 · S18 · Post-Day-2 review fixes (4 bugs)

- **Why:** External review of commit 22c8805 found 4 bugs the green suite missed.
- **What I did:** (1) Disabled uvicorn access log in Dockerfile + Makefile + app logger (PRIV-3) with a real-uvicorn integration test asserting no client IP/query in output. (2) Eval runs got immutable identities (split, n, sample-set hash, config, prompt version, run id) and `write_run` refuses overwrite. (3) Grounding accumulates usage across retry generations and preserves it on `ModelError`; API records spend on 502/504 too, so a spend cap trips after failed generations. (4) Dev/held-out are fixed partitions (100/rest); `--n` only limits inside a partition and invalid limits are rejected.
- **Result / evidence:** 59 backend + 22 eval tests pass; reviewer numbers reproduced in test (two malformed generations record $0.003350, cap at $0.002 trips next call); smoke rerun writes a new immutable dir at $0 (cache).
- **Decision:** None; all four fixes implement existing PRIV-3/EVAL-7/EVAL-9/API-6 requirements.

## 2026-10-29 · S19 · Day 3 harness completion

- **Why:** Day 3 needs held-out, Pro, negatives, SAM ablation and calibration numbers from the production path (EVAL-3..7); the Day 2 harness had label-only SAM, no negatives, no calibration.
- **What I did:** Test-first: stratified Pro sampler (group x ui_type, seed 0), seeded cross-app negatives builder, synthetic injection/harmful/PRIV-10 fixtures rendered with headless Chrome, AUROC/reliability/tau metrics, RESULTS.md generator, bounded concurrency, SAM ablation with its own response cache, atomic spend/cache writes. Downloaded full Pro annotations (1,581 rows) and only the 300 sampled images.
- **Result / evidence:** 28 eval tests pass; runs in `eval/results/2026-10-29-*` with `predictions.jsonl` per run.
- **Decision:** None; implements ARCH section 13.

## 2026-10-29 · S20 · Benchmark + checkpoint

- **Why:** R1/R2/R5 kill criteria are decided at the Day 3 checkpoint with pre-registered responses.
- **What I did:** Ran v2 held-out (1,172), Pro 300 Spark + Wonder, negatives 222, SAM ablation 100, calibration, verifier on dev + held-out cached predictions. Founder-facing spend announced before each run.
- **Result / evidence:** v2 90.7%, Pro 63.7%/66.7%, honesty 60.5%, AUROC 0.622, verifier lift +0.6/+0.8 pts, SAM gate 87.8% IoU 0.514 vs 0.556. `eval/results/RESULTS.md`.
- **Decision:** D22 Spark minimal default, no Wonder escalation; D23 verifier off + confidence out of UI; D24 SAM policy kept pending Day 6 human ratings.

## 2026-10-29 · S21 · SAM lossless bug

- **Why:** First ablation showed gate pass 0/97, which would have falsely killed the SAM story (R5).
- **What I did:** Reproduced live, inspected a real response: payload starts `~` (lossless encoding) not `!` (one_bit); `sam.py` hardcoded one_bit and swallowed the decode error into box mode. Recorded the real response as a fixture, failing test, then marker-based encoding.
- **Result / evidence:** Gate pass 0% -> 87.8%; 7 SAM tests pass. Same pattern earlier: verifier `max_tokens=64` returned null content (reasoning tokens), fixed to 1024 with a payload regression test.
- **Decision:** D25; ARCH section 6 updated same day.

## 2026-10-29 · S22 · Web skeleton + browser redaction

- **Why:** Day 4 core loop needs the app shell and PRIV-1 redaction library ready (FLOW-2, PRIV-7, PRIV-9).
- **What I did:** Two free-DeepSeek subagents on disjoint files (skeleton; redaction), main-agent integration: added `tesseract.js` dep, root pnpm workspace, Makefile web targets, dev OCR bench page. Self-hosted Atkinson font + tesseract assets with provenance hashes.
- **Result / evidence:** `pnpm --filter web build/lint/typecheck` green; 71 web tests (68 redaction incl. shared-vector parity with pytest, EXIF strip, symbol-brand construct); OCR bench in real Chrome: 106-214 ms per fixture.
- **Decision:** Phone timing stays a founder task (A4 half-measured).

## 2026-10-29 · S23 · Review loop

- **Why:** 00-common requires code + security review on redaction/logging days; gate is 8.5/10.
- **What I did:** Two read-only DeepSeek reviews. Security 8.5/10; code review 6.5/10. Fixed confirmed findings (forgeable brand, silent OCR failure, EXIF fail-open, spend/cache atomicity, pooled negatives headline, PRIV-10 probes, Meta-host pin); rejected three with reasons in MEMORY.
- **Result / evidence:** `make lint test` green (120 backend + 28 eval + 71 web); regenerated SAM/negatives/calibration artefacts after fixes.
- **Decision:** No privacy rule weakened; verifier stays unwired while D23 keeps it off.

## 2026-10-30 · S24 · Core loop end to end + first deploy (Day 4)

- **Why:** Day 4 DoD: public URL live (WEB-3) with redaction → step → outline on a real screenshot, PRIV-1 green in CI.
- **What I did:** Generated TS client from OpenAPI (API-8, stdlib generator + CI drift); built /app flow (start/review/looking/step, overlay SVG with badge/magnifier/SAM crossfade, all states, read-aloud, text-only history); Playwright FLOW-1..13 + PRIV-1/2/4 (23 tests); deployed Vercel web + Python API (lhr1) with rewrites, env by name only, headers verified; 5 manual runs on live site.
- **Result / evidence:** Playwright 23/23; `make lint test` green (130 backend + 31 eval + 77 web); live step ok ($0.003669) + refine outline (1297 ms) on synthetic billing fixture; manual outcomes in `eval/manual/2026-10-30/outcomes.md` (1 right, 2 honest cookie-blocker steps, 1 honest blocked, 1 plausible). Reviews: 8.6 / 8.5 subagents, security 7.0 + code 7.5 → fix loop → re-review 8.3 → gate one-liners fixed → all suites green.
- **Decision:** D27 (CSP wasm/inline), D28 (Vercel-verified rate key, in-memory caps residual to Day 5), D29 (15 s OCR fallback).
