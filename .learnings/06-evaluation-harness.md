# 06 Evaluation harness

Purpose: explain how ShowMe will be measured, why those benchmarks, and how I stop myself from fooling myself. Tags are explained in [README.md](README.md). As of 2026-10-29 (Day 3) all headline benchmarks have run: ScreenSpot-v2 held-out 90.7% (1063/1172), ScreenSpot-Pro stratified 300 Spark 63.7% / Wonder 66.7%, negatives strict honesty 60.5%, SAM ablation and calibration measured. Every number below links to a generated file under `eval/results/` (`RESULTS.md` index). Dev split remains tuning-only.

### Q: What will you measure, and what has been measured so far?

**Short answer:** [Measured] Click accuracy: v2 held-out 90.7% (mobile 91.9%, web 91.1%, desktop 88.6%; text 91.8%, icon 89.2%), Pro 300 Spark 63.7% (icon 40.0% is the weak spot), Wonder 66.7%. Honesty: 60.5% strict. Calibration AUROC 0.622. SAM gate pass 87.8%. E2E 20-task suite still planned Day 5-6.

**Detail:**
- Targets (goals): v2 at least 85%, Pro at least 40%, negatives at least 90%, E2E at least 70%, p50 at most 3.5 s and p95 at most 7 s, cost at most $0.01 per step.
- Day 3 is evaluation day. Day 6 completes the E2E run.
- Rule: if something has not run, the report says "not run", never an estimate.

**Evidence:** [PRD.md section 6.1](../docs/PRD.md), [PHASES.md Days 3 and 6](../docs/PHASES.md), [SPIKES.md (b)](../docs/SPIKES.md), [RULES.md section 2](../docs/RULES.md)

### Q: Why ScreenSpot, and why three versions?

**Short answer:** [Decided] ScreenSpot is the standard benchmark for "given an instruction, click the right element on a screenshot". I use v1 only for the Day 1 smoke test, v2 as the headline, and Pro as the hard test with headroom.

**Detail:**
- v1: ungated, Apache-2.0, fetched row by row without a full download. 10 samples, stratified 4 mobile, 3 desktop, 3 web, text and icon targets. Modern models nearly saturate it, so it proves the API works, not that ShowMe is accurate.
- v2: `OS-Copilot/ScreenSpot-v2`, Apache-2.0, bbox absolute xywh, run in full (sample count UNVERIFIED until download; expected about 1,272, the same as v1). It fixes v1's label errors (D10).
- Pro: `likaixin/ScreenSpot-Pro`, MIT, bbox absolute xyxy, stratified 300 by group and ui_type, seed 0.
- Licences are fine for public results; I cite the datasets in the README.

**Evidence:** [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [MEMORY.md D10](../docs/MEMORY.md), [SPIKES.md (b) and Benchmarks](../docs/SPIKES.md), [RISKS.md watch list](../docs/RISKS.md), [../spikes/grounding/fetch_samples.py](../spikes/grounding/fetch_samples.py)

### Q: What is the metric exactly?

**Short answer:** [Decided] Click accuracy: the prediction counts as correct if the predicted point lies inside the ground-truth bounding box. Reported by platform (mobile, web, desktop) and element type (text, icon) for v2, and by group and ui_type for Pro.

**Detail:**
- Same definition as the spike's "point-in-box".
- Secondary metrics: absent-target honesty, confidence AUROC and reliability bins, highlight IoU (model box versus SAM agreement-gated), latency p50 and p95, cost per step.
- Every reported number links to a `predictions.jsonl` with the raw request, response and score per sample (EVAL-7).

**Evidence:** [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [REQUIREMENTS.md EVAL-3 to EVAL-7](../docs/REQUIREMENTS.md), [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py)

### Q: Your benchmark is easy, so what?

**Short answer:** [Known limitation] That is true of the one I have run. ScreenSpot v1 with 10 samples is near-saturated and only shows the API works. That is why the plan includes ScreenSpot-v2 in full, ScreenSpot-Pro for headroom, and an end-to-end suite on real sites.

**Detail:**
- SPIKES says it directly: n = 10 and v1 is near-saturated by modern models, so 10/10 does not show real-world accuracy.
- Even v2 and Pro are static screenshots with a single instruction. They do not measure multi-step success, which the E2E suite does.
- Kill/pivot: if v2 held-out is below 75% or Pro below 25% at the Day 3 checkpoint, I switch to Wonder if it is at least 10 points better with p95 at most 8 s, or narrow the pitch to web and mobile consumer flows and say so.

**Evidence:** [SPIKES.md (b)](../docs/SPIKES.md), [RISKS.md R1](../docs/RISKS.md), [PRD.md section 6.1](../docs/PRD.md)

### Q: How do you avoid overfitting your prompt to the benchmark?

**Short answer:** [Decided] Prompt tuning happens only on a fixed dev split, the first 100 of a seeded shuffle of v2. Headline numbers are from the rest of v2 and from ScreenSpot-Pro, which are never used for tuning. The runner refuses `--split dev` for headline reports.

**Detail:**
- EVAL-9 and rule section 5.
- Any prompt change bumps `PROMPT_VERSION` and needs a dev-split run; the response cache is keyed on prompt version so results cannot silently carry over.
- Weakness I accept: Day 6 fixes failures found by E2E and eval. Those are done with dev-split reruns only, but I will have seen the failure categories of the held-out data. I will say that.

**Evidence:** [REQUIREMENTS.md EVAL-9](../docs/REQUIREMENTS.md), [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [RULES.md section 5](../docs/RULES.md), [PHASES.md Day 6](../docs/PHASES.md)

### Q: What is the negatives suite and what does it show?

**Short answer:** [Measured] 60.5% strict `not_visible` (121/200), 13 more `unsure`, 61 false `ok` (30.5%) - below the 90% goal and reported as the main honesty gap. Synthetic probes: prompt-injection 10/10 not followed, harmful goals 10/10 refused, PRIV-10 reveal-hidden probes 2/2 refused (`eval/results/2026-10-29-negatives-*/report.md`).

**Detail:**
- Spike precursor: 5/5 honest answers on five hand-picked absent targets, for example "cancel my Netflix subscription" on an iOS home screen. That used the spike's `target_visible` flag and a confidence below 0.3 rule.
- My own reservation: pairing with a different app's screenshot can occasionally put a genuinely similar element on screen (for example a generic "log out"), which would be a false penalty. I should spot-check a sample before trusting the number. This is my reasoning, not a documented finding.
- Planned additions: 5 injection screenshots and 10 refusal probes (watch list).

**Evidence:** [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [SPIKES.md (b)](../docs/SPIKES.md), [RISKS.md watch list](../docs/RISKS.md), [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py)

### Q: How will you measure calibration?

**Short answer:** [Measured] AUROC 0.622 on held-out v2 (below 0.65). The verifier pass was built and measured: +0.6 pts on dev, +0.8 pts held-out - under the 5-point bar, so per RISKS R2 it stays off and confidence comes out of the UI (MEMORY D23). The model also returned confidence values above 1.0; post-processing now clamps them.

**Detail:**
- Why it matters: in the spike every hit had confidence 0.95 to 0.98, so confidence carries no signal yet (A2 "refuted so far").
- Results decide τ for the honesty gate and whether the verifier is on. Recorded in MEMORY.md.
- Pre-agreed fallback if the verifier does not lift precision by at least 5 points: remove confidence from the UI and mark every step "Check before you tap".

**Evidence:** [ARCHITECTURE.md section 5.5](../docs/ARCHITECTURE.md), [PHASES.md Day 3](../docs/PHASES.md), [RISKS.md R2](../docs/RISKS.md), [REQUIREMENTS.md EVAL-6](../docs/REQUIREMENTS.md)

### Q: Explain the SAM ablation and why SAM cannot change click accuracy.

**Short answer:** [Decided] I report two axes. Click accuracy, which SAM cannot change by design because the click point always comes from the model. And highlight quality, measured as IoU of the model's box versus the SAM outline gated by the agreement check.

**Detail:**
- The report states explicitly that click accuracy is unchanged by SAM (EVAL-4).
- Spike evidence: refinement did not help clicks (raw 10/30, refined 11/30), and on 16 targets the model box scored a mean IoU of 0.57 against 0.51 for SAM box prompts and 0.41 for point prompts.
- Day 3 ablation [Measured]: gate pass 87.8% (86/98), mean IoU model 0.556 vs SAM-gated 0.514, SAM better on 20/86. A Day 3 bug (SAM `lossless` payloads rejected) initially made gate pass 0/97; fixed test-first (D25). Human ratings on Day 6 decide whether the policy narrows (D24).
- ScreenSpot ground-truth boxes are often loose, so IoU is a weak proxy for "is the highlight right". The E2E suite adds human-rated highlight quality (good, partial, wrong) per step in a CSV.
- If the cut list requires, the human CSV goes first, but the IoU ablation stays.

**Evidence:** [SPIKES.md (c)](../docs/SPIKES.md), [REQUIREMENTS.md EVAL-4](../docs/REQUIREMENTS.md), [PHASES.md cut list](../docs/PHASES.md), [../spikes/sam/pipeline_preview.py](../spikes/sam/pipeline_preview.py)

### Q: What is the end-to-end Playwright suite?

**Short answer:** [Planned] 20 public-site tasks, each with a start URL, a goal and a success predicate (URL regex or visible text). A Playwright driver screenshots, runs the real redaction pipeline, calls `/v1/step`, performs the suggested action, and repeats up to 10 steps. Target: at least 70% success.

**Detail:**
- Reports success rate, average steps, honesty events, and saves the redacted screenshot trail as evidence.
- Tasks use stable public sites such as gov.uk, Wikipedia and the BBC because live sites change. The run date is recorded.
- Human-rated highlight quality per step is recorded in a CSV by me.
- This is the only evaluation that goes through the real redaction pipeline, so it is the only one that captures the effect of redaction on accuracy. Public benchmark images are run without redaction.
- If behind, the suite can shrink from 20 to 12 tasks, stated openly.

**Evidence:** [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [REQUIREMENTS.md EVAL-8](../docs/REQUIREMENTS.md), [PHASES.md Days 5 and 6, cut list](../docs/PHASES.md), [RISKS.md watch list](../docs/RISKS.md)

### Q: Is the eval the same code as production?

**Short answer:** [Decided] Yes by design. The eval imports `showme.core` and uses the production prompt, schema, post-processing and image preprocessing (downscale to 2560 px (D20) and JPEG encode).

**Detail:**
- EVAL-2 has an import check test. Rule: no eval-only prompt tricks.
- One honest difference: eval images are not redacted, because public benchmark images contain no user PII. The report states that.
- The spike code in `spikes/` is throwaway and never imported by the product, so Day 1 numbers are a different code path from the Day 3 numbers.

**Evidence:** [REQUIREMENTS.md EVAL-2](../docs/REQUIREMENTS.md), [RULES.md section 5](../docs/RULES.md), [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md)

### Q: How can someone reproduce your numbers?

**Short answer:** [Planned] One command from a clean clone with only `MODEL_API_KEY`: `make eval SUITE=all`. Every run writes `predictions.jsonl`, `summary.json` and `report.md` with the git SHA, prompt version, model, effort, date and cost.

**Detail:**
- Day 8 includes a fresh-clone dry run (EVAL-1).
- Responses are cached by model, prompt version, image hash and instruction, so a rerun of an unchanged config costs $0.
- Results land in `eval/results/<date>-<suite>-<config>/`, and `RESULTS.md` is regenerated from summaries, never hand-edited.
- Reproduction costs money (about $27 estimated for the full plan), and results can vary if the model is updated, which is why the model ID is pinned and logged.

**Evidence:** [REQUIREMENTS.md EVAL-1, EVAL-7](../docs/REQUIREMENTS.md), [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [RULES.md section 5](../docs/RULES.md), [PHASES.md Day 8](../docs/PHASES.md)

### Q: What does "never fake a result" mean in practice?

**Short answer:** [Decided] Every number in the README, landing page, `/eval`, demo video and submission text comes from a generated file in `eval/results/` and links to it. Results are never hand-edited. If it has not run, it says "not run".

**Detail:**
- Mocks and recorded fixtures live in `tests/fixtures/` and are never shown as product output.
- The demo video shows the live product on real screenshots, with no edited overlays and no hidden cherry-picking ("best of 3 runs" is allowed if stated).
- Bad results get the same prominence as good ones, and the README has a Limitations section.
- The landing page "How often it is right" section includes the weakest number.

**Evidence:** [RULES.md section 2](../docs/RULES.md), [DESIGN.md section 6](../docs/DESIGN.md), [PRD.md section 4](../docs/PRD.md)

### Q: Why stratify ScreenSpot-Pro to 300?

**Short answer:** [Decided] Cost and time. The full Pro set is expensive and I have a solo budget, so I take a stratified sample of 300 by group and ui_type with seed 0, run with Spark and Wonder, at about $6.5 estimated.

**Detail:**
- Stratifying keeps every group and element type represented.
- The seed makes the sample reproducible.
- Honest caveat: a sample has sampling error. I will report it as "stratified 300", not as "ScreenSpot-Pro".

**Evidence:** [ARCHITECTURE.md sections 9 and 13](../docs/ARCHITECTURE.md), [MEMORY.md D10](../docs/MEMORY.md)

### Q: What do the spikes tell you about accuracy so far?

**Short answer:** [Measured] Only that the plumbing works: 10/10 point-in-box on 10 ScreenSpot v1 samples, and 15/16 on those plus 6 synthetic targets (the miss was "update my payment method" on the synthetic billing page).

**Detail:**
- Not evidence of real-world accuracy. n is tiny and v1 is near-saturated.
- Both Spark and Wonder were 10/10, so the smoke set cannot separate them.
- Eval budget and plan assume that Day 3 may show something worse. The kill criteria are written before the result.

**Evidence:** [SPIKES.md (b)](../docs/SPIKES.md), [RISKS.md R1](../docs/RISKS.md)

### Q: What does the dev split cost in effort and why 100 samples?

**Short answer:** [Decided] 100 samples, the first 100 of a seeded shuffle of v2, is a quick and cheap loop for prompt iteration while leaving the rest of v2 unseen.

**Detail:**
- Day 2 runs the dev split with Spark minimal and sanity-checks the numbers against the spike.
- Day 2 also checks the downscale against native (A7, measured Day 2) on the dev split (A7).
- With 100 samples, differences of a few points are within noise. I should not over-read dev results.

**Evidence:** [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [PHASES.md Day 2](../docs/PHASES.md), [MEMORY.md A7](../docs/MEMORY.md)

### Q: What is the redaction eval?

**Short answer:** [Measured] Shared corpus of 50 vectors (40 positive incl. dark-mode and 3x-density text cases, 10 negative) passes in both vitest and pytest: text-level recall 100% (40/40), 0 false positives. This is regex-on-text recall, not OCR-on-pixels recall; OCR timing in real Chrome was 106-214 ms on three fixtures, phone timing still pending.

**Detail:**
- FLOW-2 and PRIV-7 are the requirements. PRIV-9 checks EXIF stripping. PRIV-1 is a network assertion rather than a benchmark.
- OCR timing in a real browser on a laptop and a mid-range phone is measured on Day 3 (target at most 2 s).
- A recall number on my own fixtures will be optimistic. A 3-person usability check on review time is the other planned evidence.

**Evidence:** [REQUIREMENTS.md FLOW-2, PRIV-1, PRIV-7, PRIV-9](../docs/REQUIREMENTS.md), [SPIKES.md (d)](../docs/SPIKES.md), [PHASES.md Day 3](../docs/PHASES.md)

### Q: How is E2E success defined and could it be gamed?

**Short answer:** [Decided] Success is a predicate on the final page (a URL regex or visible text) after at most 10 steps. The predicate is fixed in `tasks.yaml` before the run, and the redacted screenshot trail is saved as evidence.

**Detail:**
- The driver performs the suggested action itself (click at the point, type `type_text`, scroll), which tests the guidance rather than a human's ability to interpret it.
- Gaming risk: I choose the 20 tasks. I will select them before running and publish the list, including any that fail.
- Limits: tasks are on public sites with no login, so this does not test account flows like "cancel my subscription" on a real subscription page.

**Evidence:** [ARCHITECTURE.md section 13](../docs/ARCHITECTURE.md), [REQUIREMENTS.md EVAL-8](../docs/REQUIREMENTS.md)

### Q: What unit and integration tests exist beyond the benchmarks?

**Short answer:** [Planned] pytest and vitest for the grounding parser and post-processing, the SAM wrapper, redaction patterns, canvas encode and every API route, with Playwright for flows. Tests never call the real Meta API; they use respx with recorded fixtures.

**Detail:**
- Tests are named after requirement IDs (for example `test_api_3_clamps_1001`).
- Must-haves: table-driven post-processing edge cases, SAM recorded responses with mask decode, agreement check and timeout, EXIF stripping.
- CI: lint, type-check, unit tests, OpenAPI drift, gitleaks and a Docker build.
- Live calls only happen in `make eval`, `make e2e` and `make smoke`.

**Evidence:** [RULES.md section 4](../docs/RULES.md), [REQUIREMENTS.md ENG-2, ENG-3](../docs/REQUIREMENTS.md)

### Q: What would make you report a bad number anyway?

**Short answer:** [Decided] The rules do: results are generated, not edited, and "Report bad results with the same prominence as good ones". The landing page must include the weakest number.

**Detail:**
- Examples that would be reported plainly: confidence AUROC below 0.65, SAM not beating the model box on human ratings, a low Pro score, redaction recall below target.
- The plan is built around honest reporting because the product's pitch is honesty. A hidden failure would contradict the product.

**Evidence:** [RULES.md section 2](../docs/RULES.md), [DESIGN.md section 6](../docs/DESIGN.md), [RISKS.md R2 and R5](../docs/RISKS.md)

### Q: What did the 20-task E2E suite actually measure? (added 2026-10-31, Day 6)

**Short answer:** [Measured] Final full run with prompt v2 and the fixed driver: **14/20 (70.0%), average 3.7 steps, 0 refusals** (`eval/results/2026-11-01-e2e-final/report.md`). Three earlier full/partial runs are kept as the before/after chain: 7/20 at 6.65 steps (broken predicates + loops), 8/20 at 5.15 (driver fixes), 5/7 on the parser-fix subset.

**Detail:**
- Biggest lesson: the harness, not the model, caused most early failures. 7 of 20 predicates could never match (YAML `\\.` kept literal by the flat parser), clicks that open new tabs were not followed, and identical clicks looped to the 10-step cap. Trail screenshots proved the model right on e2e-03/13 while the predicate said fail.
- Fixes live in `eval/e2e/run.mjs` only (D36): new-tab follow, label-based loop guard, screenshot retry, `\\.` unescape. Prompt v2 (D37) was measured on dev-100 only: 92.0% vs v1 93.0%.
- `eval/e2e/highlight_ratings.csv`: 74 step rows (final run 74 steps + header), `shown` = sam_outline / model_box / none from the real refine responses; rating column empty for the founder.
- Remaining failures (6): cookie-banner click loops (IKEA, NHM), bot wall (Royal Mail Access Denied, honest), wrong navigation choice (Python download button), link-click no-navigation (bank holidays in final run), Firefox App Store loop.

**Evidence:** [eval/results/2026-11-01-e2e-final/report.md](../eval/results/2026-11-01-e2e-final/report.md), [MEMORY.md D36, D37](../docs/MEMORY.md)
