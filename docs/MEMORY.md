# Memory: decisions, assumptions, open questions

Running log. Append, never rewrite history: if a decision changes, add a new entry that supersedes the old one by ID. Newest daily entry at the bottom.

## Decisions

| ID | Date | Decision | Why | Evidence | Status |
| --- | --- | --- | --- | --- | --- |
| D1 | 10-27 | Grounding model `muse-spark-1.3`, `reasoning_effort=minimal` | Same 10/10 as default effort, latency 2.8 s vs 5.5 s, cost $0.0051 vs $0.0069 | SPIKES (b) | Proposed |
| D2 | 10-27 | `muse-wonder-1.0` is escalation and an eval comparison, not the default | Also 10/10 on smoke, ~3x cost; smoke set too easy to separate them | SPIKES (b) | Proposed; revisit at Day 3 checkpoint |
| D3 | 10-27 | SAM 3.1 through the Meta API, not self-hosted | Served by the API ($2.50/1k images, p50 1.3 s); HF weights gated and CUDA-oriented; required Meta model | SPIKES (a), (c) | Proposed |
| D4 | 10-27 | SAM is prompted with the model's **box**, outline shown only if it agrees with the model box; SAM never moves the click | Refinement does not fix misses; box prompt beat point prompt (IoU 0.51 vs 0.41) | SPIKES (c) | Proposed |
| D5 | 10-27 | Two-call step: `/v1/step` then `/v1/refine`; box shown first | User sees a highlight ~1.3 s sooner; stateless backend | ARCHITECTURE §3 | Proposed |
| D6 | 10-27 | Redaction MVP = OCR + regex + **mandatory** review with tap-to-blur and brush; pixel input detection is stretch | Regex 10/10; input heuristic unreliable (7/11, 6 FPs) | SPIKES (d) | Proposed |
| D7 | 10-27 | History sent as text only, never previous images | Privacy and tokens | ARCHITECTURE §5.1 | Proposed |
| D8 | 10-27 | Backend as a Vercel Python Function (FastAPI); Docker kept for local, CI and fallback | Free hosts with containers sleep (cold starts); same origin | ARCHITECTURE §10 | Proposed: change from default stack |
| D9 | 10-27 | Contributor-mode models forbidden | They grant Meta use of content | Pricing page | Proposed (rule P6) |
| D10 | 10-27 | Eval: ScreenSpot-v2 full (headline), ScreenSpot-Pro stratified 300 (hard), negatives 200, E2E 20 tasks automated with Playwright | v2 fixes v1 label errors; Pro has headroom; E2E reproducible by one command | SPIKES "Benchmarks", ARCHITECTURE §13 | Proposed |
| D11 | 10-27 | Images downscaled to ≤ 1920 px JPEG in both product and eval | Body limits, tokens, latency; eval must match production | ARCHITECTURE §7, §13 | Proposed; verify accuracy impact on dev split Day 2 |
| D12 | 10-27 | Public demo spend cap: $5/day, $60 total | Protect the $150 credit through judging | ARCHITECTURE §9 | Proposed; founder to confirm |
| D13 | 10-27 | Spoken goal via Muse Voice Transcribe (stretch), not the browser Web Speech API | Chrome's Web Speech API sends audio to a third-party server; keeps the privacy story consistent and uses a Meta model | PRD §5.2 | Proposed |
| D14 | 10-27 | Plan approved as-is; D1-D13 approved. Track = **Indie** (overrides Startup recommendation in PRD/A10 framing). Public GitHub repo `showme`, MIT licence. Vercel + Supabase accounts ready (EU London preferred). Demo cap $60 total / $5 per day confirmed; $107 total plan pre-approved, stop at $110 (R6). Founder narrative ("family calls me") confirmed true. Credit expiry date not yet pasted (Q6 sub-item stays open) | Founder answers 2026-10-27 in kickoff session | This session; audits in `.learnings/daily/2026-10-27.md` | Approved |
| D15 | 10-27 | Day-1 score gate: `scripts/score_gate.py` must print ≥ 8.5/10 before a day is called done; below that, fix-and-rerun loop, never hand-edit the score | Founder request: persistent 0-10 gate with loop engineering | `docs/SCORE.md` (generated) | Approved |
| D16 | 10-27 | Honesty wording: PRIV-1/2/5 hold for the official client; the backend cannot prove an arbitrary API caller redacted or consented. Privacy copy must say so | Security audit finding 3 | `.learnings/daily/2026-10-27.md` | Approved (doc fix in ARCHITECTURE §4) |

## Assumptions

| ID | Assumption | Status | How it gets checked |
| --- | --- | --- | --- |
| A1 | Muse Spark grounding stays ≥ 85% on ScreenSpot-v2 | Untested (smoke 10/10 on v1) | Day 3 full run |
| A2 | Confidence can gate honesty | **Unsupported** (0.95 to 0.98 on hits only, n=10, no miss sample, so AUROC undefined) | Day 3 calibration; verifier pass |
| A3 | `target_visible`/status catches absent targets | Supported (5/5) | Negatives suite (200) |
| A4 | tesseract.js runs ≤ 2 s on a mid-range phone browser | Untested (Node on M5: 154 to 375 ms) | Day 3 device test |
| A5 | Vercel Python Functions accept our request size and duration | Untested | Day 4 deploy |
| A6 | Standard-mode API content is not used for training | Supported by pricing page wording | Retention period still unknown (Q11) |
| A7 | Downscaling to 1920 px does not hurt accuracy much | Untested | Day 2 dev split at native vs 1920 vs 1280 |
| A8 | SAM outlines look better to users than model boxes | Mixed (IoU says no on ScreenSpot, synthetic says yes) | Human ratings in E2E |
| A9 | "How do I…" contacts are a large share of consumer support volume | Hypothesis, unsourced | Find a cited source before using it in the pitch |
| A10 | Solo founders can enter the Startup track | Supported (track description: "teams and founders building a real product") | Confirm in Official Rules |

## Open questions for the founder (ranked by how much they block progress)

| # | Question | Blocks | Recommendation |
| --- | --- | --- | --- |
| Q1 | Do you approve this plan (scope, stack change D8, eval design)? | Everything after Day 1 | Approve, or name the changes |
| Q2 | Can I `git init`, create a **public** GitHub repo (name `showme`?) and add an MIT licence? | Day 2 CI, deploy | Yes, public from Day 2 so CI is free and judges see history |
| Q3 | Indie or Startup track? | Pitch framing, README tone | Startup: its judging criteria (technical execution, production readiness) match the eval-heavy plan, and it is open to founders |
| Q4 | Please confirm your acceptance email and find the **Official Rules / submission requirements** (video length, repo, deployed URL, Meta model usage proof) in the dashboard or Discord | Day 8 deliverables | Paste them into MEMORY.md when found |
| Q5 | Do you have Vercel and Supabase accounts (and is GitHub linked to Vercel)? Preferred Supabase region (EU London)? | Day 4 to 5 | EU region for the GDPR story |
| Q6 | Is a $60 total public-demo cap OK, and is the $150 credit visible on the billing page with an expiry date? | Day 5 limits | Yes to $60; tell me the expiry |
| Q7 | Founder narrative: is the "family calls me" story true for you? If not, what is the real one? | Landing, video | Must be true (RULES §2) |
| Q8 | Demo video: will you do the voice-over? Is a relative willing to appear (with consent)? | Day 8 | Voice-over by you; no real accounts on screen |
| Q9 | UK English only for MVP? | Copy, OCR language | Yes; other languages stretch S5 |
| Q10 | Custom domain, or `*.vercel.app`? | Day 8 polish | `*.vercel.app` unless you already own one |
| Q11 | What is the retention period for Meta Model API standard-mode content? Not stated on the pricing page (SPIKES (a)) | Privacy page wording | Ask in the hackathon Discord or Meta docs support; state what is known and unknown |

Resolved 2026-10-27 (D14): Q1 approved, Q2 public `showme` + MIT, Q3 Indie, Q5 accounts ready, Q6 cap confirmed (expiry date still to paste), Q7 story true. Still open and blocking later days: Q4 (Official Rules, needed Day 2 founder task) and Q11 (retention).

## Daily log

### 2026-10-27 (Day 1)

- Ran spikes (a) to (d); all GO with two important findings: confidence is uncalibrated, and SAM does not improve click accuracy (it is a highlight tool). See SPIKES.md.
- Wrote PRD, REQUIREMENTS, ARCHITECTURE, RULES, PHASES, DESIGN, MEMORY, RISKS; `.learnings/` step log and Q&A.
- API spend today: about $0.80 on spikes (71 grounding calls, 15 of them on Muse Wonder; 94 SAM calls). **Estimate** from usage × price table, not from the billing page.
- Next: founder approval and answers to Q1 to Q5; then Day 2.
- Evening kickoff audit: 3 internal subagent audits (7.0, 5.5, 6.0/10) + Meta API reviewers `muse-spark-1.3` (7.6) and `muse-wonder-1.0` (7.8), ~$0.04 (8,192 prompt tokens each). All below 8.5 gate, so fix loop ran same evening: founder decisions recorded (D14-D16), day-2 prompt placeholders filled, spend/cache/rate-limit/CSP spec fixes, PRIV-10/PRIV-11 + API-9 added, `.gitignore` hardened, persistent score gate added. Founder briefing: `.learnings/daily/2026-10-27.md`. Rejected/deferred audit items with reasons are listed there (no fabricated spike logs per RULES §2).
- Next: Day 2 (Oct 28 prompt, now filled in). Founder: paste Official Rules (Q4) + credit expiry (Q6) into MEMORY.md.
