# 05 Rate limits, cost and scale

Purpose: answer questions about limits, abuse control, unit cost, budget and what happens as usage grows. Tags are explained in [README.md](README.md). Provider limits and prices are read from Meta's pages (SPIKES.md (a)). Per-step cost is arithmetic on measured token usage, not a billing statement. The limits ShowMe enforces are designed, not built.

### Q: What rate limits does Meta impose?

**Short answer:** [Measured] Per team, not per key. Muse Spark 1.3: 3,000 RPM and 4M TPM. Muse Wonder 1.0: 3,000 RPM and 4M TPM. SAM 3.1: 3,000 RPM. Muse Voice Transcribe: 256 concurrent streams. A 429 may carry a `Retry-After`.

**Detail:**
- "Per team" means every key and every user of my public demo shares one budget with anything else on the team account.
- The contributor model has a lower limit (150 RPM) and is forbidden anyway. `muse-image-1.0` is 150 RPM and not in the core loop.
- Meta's docs recommend exponential backoff with jitter from about 500 ms.
- I have not run a load test. The 3,000 RPM figure is from the docs, not something I measured.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md)

### Q: How do you handle a 429 from Meta?

**Short answer:** [Decided] Retry with exponential backoff and jitter from 500 ms, honouring `Retry-After`, at most 3 tries. If it still fails, the user gets a typed error.

**Detail:**
- To be implemented in the grounding and SAM modules and verified by a pytest with respx-mocked responses (API-5).
- Timeouts: ground 15 s, SAM 4 s, whole request 25 s.
- Failure outcomes: 502 `model_error` after retries, 504 `model_timeout`. A SAM failure never fails a step; it falls back to the box.
- The UI copy for model errors: "That did not work on our side. Your screenshot was not saved. Try again."

**Evidence:** [REQUIREMENTS.md API-5](../docs/REQUIREMENTS.md), [ARCHITECTURE.md sections 4 and 9](../docs/ARCHITECTURE.md), [DESIGN.md section 4.7](../docs/DESIGN.md)

### Q: What limits do you put on users?

**Short answer:** [Decided] Per IP: 30 steps per hour and 150 per day, and 5 guide creations per day. All configurable through environment variables. Over the limit returns a 429 with a human message.

**Detail:**
- Counters live in `usage_counters`, keyed by a salted daily IP hash. The salted hash is deleted after 48 hours.
- Input limits: goal 1 to 300 characters, history up to 20 items, image decoded up to 3 MB and max side 2048 px, guide up to 15 steps.
- UI copy: "You have used ShowMe a lot this hour. Try again at 3:40 pm."
- In-memory backend for local dev on Day 2, Supabase backend behind the same interface on Day 5.
- Day 5 (2026-10-31) [Built; live pending founder Supabase]: Supabase counters via `increment_counter` RPC (async client, fixed hourly/daily window buckets, UTC salted IP hash D32); production fails closed if Supabase env is missing. Two measured corrections: `/v1/refine` no longer consumes step quota (counting it halved the 30/hour in the first E2E run), and guide GET has no IP limit (server-side `/g` fetch shares one egress IP). Open check F2: after deploy, probe whether the web rewrite preserves the viewer IP for rate-limit keys (30 free invalid refine calls via rewrite + 1 direct; see MEMORY 2026-10-31).

**Evidence:** [ARCHITECTURE.md sections 4 and 9](../docs/ARCHITECTURE.md), [REQUIREMENTS.md API-6](../docs/REQUIREMENTS.md), [PHASES.md Days 2 and 5](../docs/PHASES.md), [DESIGN.md section 4.7](../docs/DESIGN.md)

### Q: What is the spend cap, and what happens when it trips?

**Short answer:** [Decided] A global cap of $5 per day and $60 total for the public demo, tracked in a `spend:<date>` counter from usage tokens times the price table. Over the cap returns 503 `spend_cap_reached`, and the UI says ShowMe is resting until tomorrow and the screenshot was not sent.

**Detail:**
- Purpose: protect the $150 credit through judging. D12 marks the numbers "Proposed; founder to confirm" (Q6).
- Pre-agreed escalation (R6): if total account spend (eval, development and public demo) hits $110 of the $150 credit, anonymous use switches to "demo mode" with pre-recorded sample screens and 10 live steps per IP per day until judging ends.
- Every response includes `timings_ms` and `cost_usd` (API-7) so the cap is based on actual usage tokens.
- Test planned on Day 7: spend cap trip test and a rate-limit test from a second IP.

**Evidence:** [ARCHITECTURE.md section 9](../docs/ARCHITECTURE.md), [RISKS.md R6](../docs/RISKS.md), [MEMORY.md D12, Q6](../docs/MEMORY.md), [PHASES.md Day 7](../docs/PHASES.md)

### Q: How much does one guided step cost?

**Short answer:** [Measured] About $0.0076, which is one grounding call at about $0.0051 plus one SAM call at $0.0025. It is an estimate: tokens times list price, not a billing statement.

**Detail:**
- Grounding at minimal effort: 3,422 input tokens and 195 output tokens (142 reasoning) per call. Muse Spark 1.3 is $1.25 in and $4.25 out per 1M tokens.
- SAM 3.1 is $2.50 per 1,000 images, which is $0.0025 per call.
- A 5-step task is about $0.04.
- Wonder is about $0.0157 per grounding call, and a verifier pass would add about $0.002 and about 1 s (estimate).
- Target: at most $0.01 per step.

**Evidence:** [SPIKES.md (a), (b) and cost section](../docs/SPIKES.md), [PRD.md section 6.1](../docs/PRD.md), [ARCHITECTURE.md section 9](../docs/ARCHITECTURE.md)

### Q: What is the budget plan for the $150 credit?

**Short answer:** [Decided] About $27 for evaluation, about $20 for development, and a $60 cap on the public demo, which is about $107 of the $150 and leaves about $43 of margin.

**Detail:**
- The $150 credit was confirmed by the founder. Credits cover about 19,700 steps before eval spend.
- Eval estimate: ScreenSpot-v2 full (about 1,272 samples, count UNVERIFIED until download) x ($0.0051 + $0.0025) is about $9.7; ScreenSpot-Pro 300 with Spark and Wonder about $6.5; negatives 200 about $1; E2E 20 tasks of about 6 steps about $1; reruns multiplied by 1.5 gives about $27.
- Eval responses are cached by model, prompt version, image hash and instruction, so reruns of unchanged configs cost $0.
- Spend discipline: check `eval/results/spend.json` before a large run, and stop and record if total eval spend would exceed $40.
- Day 1 spike spend was about $0.80, an estimate from usage times the price table (71 grounding calls, 15 on Wonder, 94 SAM calls).

**Evidence:** [ARCHITECTURE.md section 9](../docs/ARCHITECTURE.md), [RULES.md section 5](../docs/RULES.md), [MEMORY.md daily log](../docs/MEMORY.md), [SPIKES.md cost](../docs/SPIKES.md)

### Q: What stops one person burning the whole budget?

**Short answer:** [Decided] Three layers: per-IP hourly and daily limits, the global daily and total spend caps, and a pre-agreed switch to demo mode if total spend reaches $110.

**Detail:**
- Limits per IP can be bypassed by someone with many IPs, which is why the global cap is the real backstop.
- Because Meta's limits are per team, abuse could also throttle my own eval runs. I would run large evals outside peak judging windows.
- I have not done a threat analysis of distributed abuse beyond these controls.

**Evidence:** [ARCHITECTURE.md section 9](../docs/ARCHITECTURE.md), [RISKS.md R6](../docs/RISKS.md)

### Q: What are the latency numbers and targets?

**Short answer:** [Measured] Grounding at minimal effort: p50 2,809 ms and max 3,555 ms. SAM 3.1: p50 1,338 ms and p95 2,454 ms. The target for server-side grounding is p50 at most 3.5 s and p95 at most 7 s.

**Detail:**
- Default effort was p50 5,485 ms and max 12,814 ms. Wonder at minimal was p50 3,069 ms and max 5,069 ms.
- Run in sequence, grounding plus SAM is about 4 to 5 s (RISKS R4). Production makes one SAM call, after the box is shown, so the box itself appears at the grounding time.
- Client-side OCR adds time: 154 to 375 ms in Node on the M5. Browser time is UNVERIFIED.
- Kill/pivot: if production grounding p95 exceeds 8 s, move to a smaller image (1280 px) after checking dev-split accuracy; if SAM p95 exceeds 4 s, the outline becomes opt-in.

**Evidence:** [SPIKES.md (b) and (c)](../docs/SPIKES.md), [RISKS.md R4](../docs/RISKS.md), [PRD.md section 6.1](../docs/PRD.md)

### Q: What are the hosting limits you are working inside?

**Short answer:** [Known limitation] Vercel Hobby for the web app and the Python function, Supabase free tier, GitHub Actions. All free, and several limits are UNVERIFIED until the Day 4 deploy.

**Detail:**
- Vercel Python functions: I believe there is a 4.5 MB request body cap, but that is UNVERIFIED for the current limits and must be checked on Day 4. The 2560 px JPEG is about 300 KB per image.
- Function duration limits against my 25 s request timeout: untested.
- Supabase free tier pauses after 7 days of inactivity; the daily purge cron keeps it active through judging.
- If the Vercel function fails body or time limits, I deploy the same Docker image to Render or Cloud Run that day.

**Evidence:** [ARCHITECTURE.md section 10](../docs/ARCHITECTURE.md), [RISKS.md R7](../docs/RISKS.md), [MEMORY.md A5](../docs/MEMORY.md)

### Q: What happens at 10x the users?

**Short answer:** [Known limitation] I have not modelled it. What I can say from the docs: cost grows linearly at about $0.0076 per step, the public demo is capped at $5 per day, and the shared Meta limits are per team.

**Detail:**
- The public demo is designed for hackathon judging, not for sustained load, and the caps are set so it fails closed (503) instead of expensive.
- The backend is stateless, so more function instances do not need coordination except through the counters in Supabase.
- I have not verified that Supabase free tier counters can handle concurrent updates at higher rates. That is a gap.

**Evidence:** [ARCHITECTURE.md sections 1 and 9](../docs/ARCHITECTURE.md), [SPIKES.md cost](../docs/SPIKES.md)

### Q: What happens at 1000x the users?

**Short answer:** [Known limitation] It is not a design target for the hackathon. The honest answer is that I would hit the Meta per-team limits, the free-tier hosting and my budget first, and I would need a paid plan, higher Meta limits and a real database.

**Detail:**
- The Meta 3,000 RPM and 4M TPM limits are per team. I have not computed how many concurrent users that supports. Each call carries a single image of about 3,422 input tokens in my spike, so the token limit may bind before the request limit. That needs checking.
- The business hypothesis assumes paying customers fund usage (about $38 of API cost for 5,000 steps in the Starter plan).
- Enterprise ideas in the PRD (data residency, running Muse Spark Open on the customer's cloud) are hypotheses, not built or verified.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md), [PRD.md section 8](../docs/PRD.md), [ARCHITECTURE.md section 10](../docs/ARCHITECTURE.md)

### Q: Why are limits per IP, and what are the downsides?

**Short answer:** [Decided] There are no accounts, so IP is the only available identifier. The downside is shared networks and changing IPs: many people behind one address share one allowance, and one person can switch address.

**Detail:**
- The docs do not discuss the shared-network case. I would flag it as a limitation, and an event with many judges on one network is a plausible case.
- The global spend cap is independent of IP, so cost stays bounded either way.
- Per-IP limits are environment-configurable, so I can raise them if judging traffic shares an address.

**Evidence:** [ARCHITECTURE.md section 9](../docs/ARCHITECTURE.md), [PRD.md section 4 principle 5](../docs/PRD.md)

### Q: How do you know the cost number is right?

**Short answer:** [Known limitation] I do not, exactly. It is arithmetic on reported token usage and list prices. I have not compared it with Meta's billing page.

**Detail:**
- Every response will carry `cost_usd` computed from usage tokens and a price table (`pricing.py`), and eval reports cost per step from real usage.
- Open question Q6 asks me to confirm the $150 credit is visible on the billing page and when it expires.
- Reasoning tokens are billed as output tokens. At minimal effort in the spike, 142 of the 195 output tokens were reasoning.

**Evidence:** [SPIKES.md (b) and cost section](../docs/SPIKES.md), [REQUIREMENTS.md API-7](../docs/REQUIREMENTS.md), [MEMORY.md Q6](../docs/MEMORY.md)

### Q: What if the Meta credit runs out during judging?

**Short answer:** [Decided] The spend cap stops use before that, and demo mode (sample screens plus 10 live steps per IP per day) is the pre-agreed fallback once total spend hits $110.

**Detail:**
- The plan of about $107 leaves about $43 margin only if eval and development spend stay within estimate. Estimates are not actuals.
- Credit expiry date is unknown (Q6).
- Judging runs Nov 4 to 8, and the closing ceremony is Nov 9.
- The R6 trigger of $110 counts total account spend (eval, development and public demo) of the $150 credit, which leaves $40 for judging week.

**Evidence:** [RISKS.md R6](../docs/RISKS.md), [ARCHITECTURE.md sections 8 and 9](../docs/ARCHITECTURE.md), [PHASES.md buffer day](../docs/PHASES.md)

### Q: What are the unit economics for a paying customer?

**Short answer:** [Hypothesis] On the Starter widget at GBP 99 a month with 5,000 guided steps, API cost is about $38 (about GBP 30), which is a gross margin of about 70% before hosting. It rests on the measured $0.0076 per step and an unvalidated price.

**Detail:**
- The Growth overage at GBP 0.03 per step is about 5x API cost (about GBP 0.006 per step, from the GBP 30 per 5,000 steps above).
- Hosting costs and support costs are not included.
- Whether companies would pay these prices is untested (see file 08).

**Evidence:** [PRD.md section 8](../docs/PRD.md), [SPIKES.md cost](../docs/SPIKES.md)

### Q: How would you cut cost if you had to?

**Short answer:** [Decided] Use minimal effort (already the default), use the response cache in evals, keep history text-only, and make the SAM outline opt-in if latency or cost forces it. The documented pivots are images at 1280 px and demo mode.

**Detail:**
- Minimal effort cut grounding from about $0.0069 to about $0.0051 and p50 from 5,485 ms to 2,809 ms in the spike.
- SAM is $0.0025 of the $0.0076 per step, and it only draws the outline. It is the first thing to make optional (R4).
- The verifier pass, if turned on, adds about $0.002 per step as an estimate.

**Evidence:** [SPIKES.md (b) and cost](../docs/SPIKES.md), [RISKS.md R4](../docs/RISKS.md), [ARCHITECTURE.md section 5.5](../docs/ARCHITECTURE.md)
