# ShowMe hackathon brief and submission plan

Updated 2026-11-02, Europe/London. Repository snapshot: 4f974e4.

**Superseded numbers:** sections 5 and 6 predate prompt v3. Current figures and spend: [README section 5](../README.md), [SUBMISSION section 5](SUBMISSION.md), [MEMORY](MEMORY.md) (ledger $36.2421 plus the D50 estimate of about $3.32, so about $0.44 under the $40 eval ceiling: no paid eval fits without founder approval). Rules, dates, rubric and form facts remain current.
Scope: official event facts, current project evidence, independent product/engineering/evaluation reviews, and proposed work before submission. This document does not certify eligibility or predict a prize.

Confidence: **[Certain]** directly observed official source, code or artifact; **[Likely]** engineering/product judgement; **[Guessing]** unresolved speculation. A proposed action is not a completed result.

## 1. Official sources and the correction to earlier uncertainty

**[Certain]** The authenticated [participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details) and [submission form](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit) were read in the founder's signed-in Chrome session on November 2. The unauthenticated browser redirected to login. No form fields were changed, no permission checkbox was accepted, and no submission was made.

**[Certain]** The participant guide now verifies the numerical judging weights, team limit, prizes and video requirement that could not previously be verified from the public landing page. Earlier notes calling these publicly unverified reflected the source boundary then; they are now verified against the participant guide.

Sources:
- [Participant guide: rules, submission, judging and prizes](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details)
- [Actual submission form](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit)
- [Public organizer overview](https://cerebralvalley.ai/e/meta-ai-developer-hackathon)
- [Meta event overview](https://dev.meta.ai/events/global-hackathon)

The participant guide is more specific than the public overview. This review did not accept or separately audit the legal waiver.

## 2. Dates, requirements and eligibility evidence

### Dates

| Item | Verified requirement or internal plan |
| --- | --- |
| Official submission deadline | **[Certain]** Wednesday November 4, 2026, 21:00 Eastern Standard Time; Thursday November 5, 02:00 London. |
| Feature freeze | **[Certain]** Monday November 2, 23:59 London is ShowMe's own freeze, not an organizer requirement. |
| Suggested submission buffer | **[Likely]** Aim to submit by November 4, 18:00 London, keeping eight hours before the host deadline for failures. This is a recommendation. |
| Last full troubleshooting day | **[Certain]** The participant guide identifies November 3 as the last full day for submission questions and technical troubleshooting. |
| Judging | **[Certain]** The detailed guide specifies November 5–8. The public overview says November 4–8; use the detailed guide for this plan and check announcements for changes. |
| Final round | **[Certain]** November 9, 12:00 ET / 17:00 London: top five projects per track, live video judging and winners. |
| Community award | **[Certain]** Guide says the community-vote winner is announced November 16. |

### Submission validity checklist

| Requirement from guide | ShowMe status and next proof |
| --- | --- |
| Incorporate Meta models and fit one stated theme | **[Certain]** Source uses muse-spark-1.3 and sam-3.1. Proposed theme is Build for Your World. **[Likely]** A real helper story makes that fit defensible; judges decide the fit. |
| Public open-source repository | **[Certain]** Repository is [jeevesh2515/showme](https://github.com/jeevesh2515/showme). Recheck unauthenticated access and the licence before submission. |
| Solo or at most four participants | **[Certain]** Guide permits solo participants and teams of up to four. Founder must list everyone who worked on the project accurately. |
| Demonstrate event-period original work | **[Certain]** Guide requires the demo and submission to identify features/code created during the event. **[Likely]** Include a short build-period/contribution statement with commits, distinguish dependencies and datasets, and do not present third-party work as original. |
| Rights to code, data and assets; compliance with policies | **[Certain]** Guide lists violations and unlicensed assets as disqualifying. Founder must complete the rights/attribution check; this document is not proof of every asset's licence. |
| Three-minute demo video | **[Certain]** Guide and form both specify a three-minute demo. Current two-minute outline in [SUBMISSION.md](SUBMISSION.md) needs adaptation. Video recording and accessible final URL are not evidenced in the repo. |
| Accessible links and representative | **[Certain]** Guide asks for accessible public code/video, one project submission per team and a designated representative. |
| Actual submission | **[Certain]** Not performed in this review. A draft document, working URL or passing CI is not a submitted entry. Founder should retain the platform confirmation. |

**[Certain]** The guide flags generic image-analysis projects among examples to avoid. **[Likely]** ShowMe risks appearing in that category if the demo is only screenshot upload followed by a highlighted button. Demonstrate an actual two-person, multi-screen guidance exchange, privacy review, failure handling and model contribution. This is a strategic response to the risk, not an organizer exemption or guarantee.

### Fields observed in the submission form

**[Certain]** Prepare team identity/membership; track and theme selections; a project summary; public code and three-minute video URLs; an explanation of Meta integration and why those models matter; partner feedback where applicable; and experience surveys. The form also offers an X-post URL for the viral award.

**[Certain]** The form includes permission for the organizers to use and promote submitted materials. The founder must review that consent; use synthetic or appropriately consented material in the video. Field visibility was inspected, but final validation and submission were not exercised. Do not invent survey answers, tool usage, comparisons or satisfaction ratings.

## 3. Verified judging rubric and prize focus

From participant-guide judging section:

| Category | Weight | What ShowMe should demonstrate |
| --- | --- | --- |
| Impact | **[Certain] 30%** | **[Likely]** Identify a specific helper and recipient, show a genuine obstacle, observe the full exchange, and report whether anyone can use it without coaching. |
| Use of Meta AI tooling | **[Certain] 25%** | **[Likely]** Show Spark selecting the next action and SAM refining an eligible outline. Explain the agreement gate and unchanged click point. Report what SAM does not improve. |
| Technical depth and execution | **[Certain] 20%** | **[Likely]** Show the privacy boundary, typed contract, recovery paths, trustworthy cost controls and reproducible evidence rather than a test-count score. |
| Demo | **[Certain] 25%** | **[Likely]** Deliver an understandable three-minute narrative with a live working flow, a real recipient and honest limitations. |

**[Certain]** Stage one is a viability/theme/Meta-use pass/fail assessment; stage two scores the rubric; the five highest-scoring projects per track reach the final video round. There is no evidence here about other entrants' submissions or ShowMe's relative rank.

**[Certain]** Total prizes are $1,000,000: Indie $400,000, Startup $550,000, bonuses $50,000. Indie places receive $150,000 / $100,000 / $75,000 / $50,000 / $25,000. Bonuses cover viral engagement ($20,000), an eligible Meta open-weight build ($10,000), community vote ($10,000), agentic use ($5,000) and a creative build using the specified creative models ($5,000).

**[Likely]** Prioritize the Indie rubric. Adding open-weight hosting or a creative model solely to chase a bonus would consume time without proving the present workflow. Do not claim bonus eligibility without satisfying that category's model and delivery requirements. The viral category requires a separate post/link; no posting is authorized by this document.

## 4. What ShowMe actually does and where it might help

**[Certain]** Implemented flow, traced through [README.md](../README.md), [app page](../apps/web/app/app/page.tsx), [API](../backend/showme/api/main.py) and [shared viewer](../apps/web/components/GuideStepper.tsx):

Screenshot + goal → local OCR/pattern detection → mandatory manual review → redacted upload → Spark next-step instruction and location → progressive box / agreement-gated SAM outline → user acts in the original app → fresh screenshot for the next state. Optional second review and consent create a shared, expiring guide.

**[Certain]** A screenshot shows one state. A multi-step guide requires screenshots of subsequent states. A recipient sees annotated pictures, not a live overlay operating Spotify, Settings or another app. They must switch to the original screen to act.

**[Certain]** In the remote-helper scenario the helper already received the original screenshot, possibly through messaging. ShowMe's redaction boundary protects the subsequent upload to ShowMe/Meta; it cannot undo that prior disclosure. Pattern detection misses unstructured private text and needs review. Guide access expires after seven days; storage deletion follows the next successful purge.

**[Likely] Recommended pitch:** Turn a confusing screenshot into one clear visual next step, review private details locally, and send an expiring guide to someone you are helping.

**[Likely]** This could help with asynchronous help across different devices, where the helper cannot inspect the target app's DOM. It has not yet been shown to replace a phone call, save a particular amount of time or let older users finish tasks independently.

### Competing approaches and the evidence needed

| Alternative | ShowMe's proposed benefit | What would validate it |
| --- | --- | --- |
| A screenshot with a manually drawn arrow and short message | **[Likely]** Less helper effort when generating precise visual instructions and successive cards | Matched task comparison including review/share time, not only model response time |
| Generic screenshot conversation or live visual assistant | **[Likely]** Explicit local review, one-action presentation and an expiring handoff in a browser | Observe whether people prefer and understand the handoff; avoid exclusive feature claims |
| Remote support call/screen sharing | **[Likely]** Asynchronous help with no required remote-control installation | Measure the whole exchange and recipient app switching; privacy scope must remain accurate |

**[Likely]** Compete through specificity and evidence: one recognizable person, one complete workflow, a visible reason for both Meta models, and a credible treatment of errors. Model count, native-app packaging, internal agent scores and elaborate architecture diagrams do not establish usefulness or a winning rank.

## 5. Current evidence: what can be claimed

Evidence snapshot precedes any new paid run. [Generated index](../eval/results/RESULTS.md); [production prompt](../backend/showme/core/prompts.py).

| Measurement | Defensible statement | Qualification |
| --- | --- | --- |
| ScreenSpot-v2 | **[Certain]** 1,063/1,172 = 90.7%, Spark minimal, prompt v1, SAM off | Historical grounding benchmark; current prompt constant is v2 |
| ScreenSpot-Pro | **[Certain]** Spark 191/300 = 63.7%; Wonder 200/300 = 66.7%, minimal, v1 | Wonder advantage on this sample is three percentage points; no evidence it improves every task |
| v2 dev split | **[Certain]** 92/100 versus v1 dev-100 93/100 | Development evidence, not a new held-out headline |
| Absent-target honesty | **[Certain]** 131/210 = 62.4% strict expected-status success, v1 | Remaining outcomes include inappropriate targets and premature completion; do not call every strict miss a hallucinated highlight |
| Refusal probes | **[Certain]** 12/12 | Small, synthetic-inclusive set; not proof of general safety |
| Confidence discrimination | **[Certain]** AUROC 0.62249 | [Calibration artifact](../eval/results/2026-10-29-calibration-v2heldout/calibration.json); no calibrated-confidence guarantee |
| E2E | **[Certain]** Original run recorded 14/20; four passes suspect; remaining ten await validation | [Original report](../eval/results/2026-11-01-e2e-final/report.md). Not a verified 70% or 50% current-production result |
| SAM geometry | **[Certain]** Mean model-box IoU about 0.556 versus SAM about 0.5145 on the paired 100-sample run | Geometry is not human outline quality; SAM does not move the click point |
| Human SAM review | **[Certain]** 74 rows, no human grades: 53 outlines, nine boxes, 12 no-highlight states | [Rating sheet](../eval/e2e/highlight_ratings.csv); superiority is not established |
| Human usability and physical-phone OCR | **[Certain]** A [test kit](../eval/usability/2026-11-01-kit.md) exists; no completed participant report found | Tests must include the new helper/recipient exchange, not only self-use |
| CI | **[Certain]** Snapshot 4f974e4 passed [GitHub CI](https://github.com/jeevesh2515/showme/actions/runs/41335717180) | CI is evidence of its automated checks, not a readiness score or live user study |

**[Certain]** Benchmark preprocessing is not the entire browser production pipeline: evaluation uses public images and its JPEG encoding, while browser production includes redaction and may choose WebP. Shared core logic is valuable; full pipeline performance requires browser and phone evidence.

### Spend planning

**[Certain]** The [ledger](../eval/results/spend.json) records $22.7699. [MEMORY D50](MEMORY.md) separately records an estimate for earlier E2E calls: 437 × $0.0076 = $3.3212. Combined planning estimate: $26.0911; approximate headroom to the $40 eval ceiling is $13.9089. This is not a provider-billing reconciliation.

**[Certain]** Day-7 prompt permits $15 for today's calls, but the project/account ceilings still apply. Before any paid run reconcile today's use, previous unrecorded calls and public-demo spend; announce count/cost and check all applicable limits.

**[Likely]** Illustrative planning arithmetic for Spark: an E2E allocation of $3 plus (1,172 + 300 + 222) grounding samples × approximately $0.0051 = $11.6394. This excludes variable token use, retries, additional SAM calls and other manual use. It is an estimate, not an upper bound or permission to spend. Do not use the old negatives run's low cached cost to price a fresh prompt run.

## 6. Concrete gaps from the parallel reviews

Application code was reviewed, not changed in this task.

### A. P1 [Certain]: shared guides lose caution and uncertainty

Evidence: [trail capture](../apps/web/app/app/page.tsx), line 139; [guide schema](../backend/showme/api/guides.py), lines 15–44; [viewer](../apps/web/components/GuideStepper.tsx), lines 13–19. Relevant requirements: FLOW-6/FLOW-10 and PRIV-5.

A step shown as unsure with a caution to the helper is saved without status/caution/action/type text. The viewer reconstructs a targeted step as ok, and warnings and dashed uncertainty styling disappear. The recipient can receive stronger-looking advice than the helper saw.

Recommended fix: preserve PII-masked warning/status through trail, API generation, storage and viewer, and render them consistently. Preserve necessary safe action/typing information, or block unsupported sharing until it can be represented.

Regression: mocked unsure cancellation/payment step with a caution → create/get guide → recipient sees the same warning and uncertainty styling. Fix this before presenting shared guides as reliably preserving safety context.

### B. P2 [Certain]: process termination can bypass rate-limit restoration

Evidence: [live wrapper](../scripts/e2e_live.sh), line 52. It handles ordinary failures with an EXIT trap, but not SIGTERM. Read-only/offline signal reproduction terminated Bash without its EXIT cleanup.

Recommended fix: INT/TERM handlers must exit through idempotent cleanup; preserve failure status and document recovery for interruptions that cannot run cleanup.

Regression: mocked raised deployment, signal the wrapper with SIGTERM, assert variable removal and successful restoration deployment. This gates the automatic production rerun, not low-risk phone observations.

### C. P2 [Certain]: publication can select stale metrics after a corrected rerun

Evidence: [web results generator](../apps/web/scripts/gen-results.mjs), lines 24–32. Every directory ending in -final is processed after ordinary SHA/time-tagged runs, so the old November 1 final overrides a newer complete run. Benchmark selection sorts only by sample count; equal-sized v1/v2 runs can retain the older row.

Recommended fix: explicitly select audited publication run IDs and matching model/prompt metadata, or use deterministic eligible-version/recency rules. Do not infer quality or freshness from a directory suffix.

Regression: old final + newer complete SHA-tagged run selects the intended corrected run; equal-n v1/v2 results select the intended frozen-prompt result. Fix before publishing refreshed metrics; do not hand-edit generated files.

### D. P2 [Certain], secondary: long guides exceed the API limit without recovery

Evidence: trail grows in [app page](../apps/web/app/app/page.tsx), while [guide request](../backend/showme/api/guides.py) allows at most 15 steps. At step 16 the UI still offers creation, which fails validation.

Recommended fix: explain and enforce the supported size, or permit selecting/splitting a guide into supported parts. Regression: 15 steps succeeds; 16 has an actionable recovery before network submission. Existing ten-step E2E tasks will not exercise this.

### Previous fixes present in source

**[Certain]** The review replacement reset, durable row-before-upload cleanup, aggregate image cap, reservation-day spend reconciliation, corrected caption predicates, $0.04 pricing-derived E2E reserve, ordinary restore-error checks and non-overwriting per-run artifacts are present. These are source-level closure checks; current production behaviour was not re-certified here.

## 7. Ordered plan until submission

These are proposed work blocks, not completed tasks or guaranteed durations. Owners: founder handles people, platform declarations and final submission; implementation agent handles scoped bug fixes.

| Order / window | Action | Completion evidence |
| --- | --- | --- |
| 1. Today, parallel tracks | **[Likely]** Founder runs physical iPhone test and two-person handoff; agent fixes shared warning/status loss. Use low-consequence public tasks while safety-context preservation is unresolved. | Written observations and mocked round-trip regression; no invented time savings |
| 2. Before a paid rerun | **[Likely]** Fix signal restoration and publication selection; do not add features. | Offline failure/signal tests and synthetic old/new result-selection tests |
| 3. Before freeze tonight | **[Likely]** Freeze the demonstrated scope and final prompt after dev-only validation. Reconcile spend, then run the chosen final evaluations under budget. If scope/budget prevents a suite, explicitly retain its historical version label and record the cut; never tick it done. | Immutable results, prompt/model/revision metadata, actual-versus-estimated costs, audited success trails |
| 4. Freeze at Nov 2, 23:59 | **[Likely]** Complete affected checks/CI and deployed-revision verification through the existing approval flow. Implementation owner creates the planned release-candidate tag. | CI URL, deployment identities, rollback/recovery instructions and clear remaining limitations |
| 5. Nov 3 | **[Likely]** Record and caption the three-minute demo; prepare portal answers and attribution statement; verify repository/video as a logged-out viewer. | Real video, accessible URLs, full checklist and no placeholder claims |
| 6. Nov 4, aim 18:00 London | **[Likely]** Founder reviews declarations and permission checkbox, submits once through the platform and saves confirmation. | Actual platform confirmation before Nov 5 02:00 London |
| 7. Judging period | **[Likely]** Maintain a functioning deployment and available model credit; fix release-blocking defects, avoid experiments that invalidate the recorded demo. | Working URLs, verified limits, spend monitoring and recovery procedure |

**[Likely] Cut now:** native iOS rewrite/wrapper, voice input, enterprise widget/pricing, extra model stages and bonus-driven model migrations unless a recorded user blocker makes them necessary. Xcode is not required to test Safari or a Home Screen web app on the founder's iPhone 16.

### Two-person observation protocol

**[Likely]** Use one helper on a laptop and one recipient on the actual iPhone. Use a public task requiring at least two screens, with no real credentials or payment details in recorded artifacts.

1. Recipient captures/sends the current screenshot.
2. Helper reviews local masking, generates one next step, reviews/consents to sharing.
3. Recipient opens the guide, identifies the intended original app/tab, acts there and returns the next screenshot.
4. Repeat for another state; do not coach unless needed, and record every intervention.
5. Include an absent-control case and observe whether the person recognises and recovers from a wrong suggestion.
6. Measure total time, helper-active time, review time, screenshot cycles, wrong taps and requests for explanation. Record whether they tap the picture expecting it to control the original app.
7. Compare against a matched ordinary screenshot-plus-arrow/message task if time permits; counterbalance order rather than reusing a learned identical task.
8. Report the small exploratory sample, failures included. A self-test is useful but is not a two-person usability session or general evidence about older adults.

**[Certain]** For Spotify, reaching the cancellation control is navigation evidence; stopping before changing the subscription is not completed cancellation. Use public low-consequence tasks for the main success demonstration.

### Paired SAM review

**[Likely]** Show the same existing screenshots with box and SAM alternatives in shuffled order to an independent reviewer. Record preference, wrong-element cases and confidence separately. The founder can begin with 10–20 cases as exploratory evidence, or honestly retain not run. Agreement with Spark's box is not agreement with ground truth.

## 8. Proposed three-minute demo

This is a script plan; nothing here states the recording exists.

| Segment | Proposed content |
| --- | --- |
| 0:00–0:20 | **[Likely]** A specific, truthful helper problem and the intended recipient; avoid unsupported market-size or phone-call-duration claims. |
| 0:20–0:55 | **[Likely]** Add a made-up screenshot, show an automatic mask and manually hide a missed detail before upload. |
| 0:55–1:30 | **[Likely]** Real Spark response, progressive box, eligible SAM outline or honest fallback. Explain the two models and unchanged click point. |
| 1:30–2:20 | **[Likely]** Real recipient opens the shared guide on iPhone, switches to the original public page, acts and sends the next screenshot. Show the actual handoff rather than tapping an image as though it controls another app. |
| 2:20–2:40 | **[Likely]** One real limitation or failure/recovery. If several attempts were needed, disclose the selection. Never show mocks as live model output. |
| 2:40–3:00 | **[Likely]** Version-labelled measured evidence, what was built during the event, public URLs and honest remaining limits. |

**[Likely]** Prepare portal explanations around model roles and trade-offs: Spark provides semantic grounding/action selection; SAM refines contour presentation only; the agreement gate rejects inconsistent refinement. Do not claim SAM improves click accuracy or that this project has compared against every competitor.

## 9. Completion boundary and remaining unknowns

**[Certain]** This review used three parallel read-only reviewers (product, engineering, evidence), current source/tests/docs, GitHub CI and the authenticated organizer pages. It did not change application code, deploy, submit a form, accept terms, run paid evaluation, or conduct physical-phone/user sessions.

**[Certain]** Pending proof includes human usefulness, phone OCR performance, human SAM preference, fresh frozen-prompt results, end-to-end production release checks and the final video/submission confirmation. Current test passes do not close those gaps.

**[Likely]** ShowMe is a defensible prototype for a narrow visual help workflow. Its usefulness and competitiveness should be judged from observed task completion and the quality of its actual handoff. No evidence supports a probability of winning, a perfect-validity guarantee or an internal readiness score.


## 10. Existing agent verification and commit duties

Before committing or pushing any change, every agent must verify:

1. **Ponytail Rule**: Run `git diff HEAD`, delete speculative features or dead code, condense boilerplate, and ensure diff is lean.
2. **Quality Gates**:
   - `make lint`: Zero ESLint, TypeScript, Ruff, or Mypy errors.
   - `make test`: all unit tests pass.
   - `pnpm --filter web test:e2e`: all Playwright browser tests pass.
   - `python3 scripts/score_gate.py day7`: passes.
   - `node scripts/live_iphone16_audit.mjs http://localhost:3000`: all checks pass.
   - Paste the real command output in the commit or session notes; counts are not hard-coded here.
3. **Evidence Integrity**: Never fake a benchmark result or claim human evaluation unless personally conducted. Publish only numbers from generated files in `eval/results/`.
4. **Git Identity**: Commits must strictly be authored by `jeevesh2515` (`jeevesh2515@gmail.com`) with no co-author trailers.
