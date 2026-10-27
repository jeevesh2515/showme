# 09 Build process and AI tooling

Purpose: answer "how did you build this, and how do you know your claims are true?" Tags are explained in [README.md](README.md). Sources are the step log, SPIKES.md, RULES.md and the spike scripts. The step log records what was done on Day 1. Where an answer needs my personal account of how much I directed versus the agent did, I must fill that in truthfully myself.

### Q: How did you use AI coding agents on Day 1?

**Short answer:** [Measured] I used an AI coding agent to bootstrap the repo, check the environment, run parallel research, write and run the spike scripts, and draft the planning docs. The rules in the repo bind every human and AI agent, and the docs win over code.

**Detail:**
- Step log S0: ran `/init` in an empty folder (only an empty `README.md`, no git). The placeholder `CLAUDE.md` was later replaced by an agent guide pointing at `/docs`. `AGENTS.md` is a symlink to `CLAUDE.md`.
- S1: environment check (names only, never values): Apple M5, 16 GB RAM, Python 3.11.15, Node 22.22.3, pnpm 10.19, uv 0.11, Docker 29.8, gh 2.98, tesseract 5.5.2.
- S2: three research subagents in parallel. S3: spike (d), redaction.
- Docs written on Day 1: PRD, REQUIREMENTS, ARCHITECTURE, RULES, PHASES, DESIGN, MEMORY, RISKS.
- What I contributed versus what the agent drafted is mine to describe honestly. Do not claim more or less than is true.

**Evidence:** [.learnings/00-step-log.md](00-step-log.md), [../CLAUDE.md](../CLAUDE.md), [RULES.md section 0](../docs/RULES.md)

### Q: What were the parallel research subagents for?

**Short answer:** [Measured] Verifying public facts that might have changed after the model's knowledge cutoff, instead of trusting memory: the Meta Model API and hackathon rules, SAM 3.1 availability and hosting, and the ScreenSpot datasets.

**Detail:**
- Three subagents: Meta Model API plus hackathon rules (Sonnet), SAM 3.1 availability and hosting (Sonnet), ScreenSpot v1, v2 and Pro (Haiku).
- Each had to cite a URL per claim and mark anything unconfirmed as UNVERIFIED. That is why SPIKES.md lists source pages inline and still carries UNVERIFIED flags (standard-mode retention, submission format, browser OCR timing, Vercel limits).
- Results fed spike sections (a), (b) and (c). The ScreenSpot findings are saved in the SPIKES.md Benchmarks section, which D10 cites, with the dataset pages as sources. The v2 sample count is still UNVERIFIED until download.

**Evidence:** [.learnings/00-step-log.md S2](00-step-log.md), [SPIKES.md (a)](../docs/SPIKES.md), [MEMORY.md D10](../docs/MEMORY.md)

### Q: How did you verify claims with scripts instead of memory?

**Short answer:** [Measured] Each number in SPIKES.md comes from a script in `spikes/` or an official page linked inline, and anything else is labelled estimate or UNVERIFIED. I can re-run the spikes.

**Detail:**
- Grounding: `spikes/grounding/smoke.py` calls the API with a JSON schema and reports point-in-box, latency, tokens and absent-target honesty. `fetch_samples.py` builds the 10-sample ScreenSpot v1 set.
- SAM: `spikes/sam/run.py`, `jitter.py`, `policies.py`, `screenspot_sam.py` (local SAM 2.1 tiny), `api_sam.py` and `pipeline_preview.py` (SAM 3.1 through the API).
- Redaction: `spikes/redaction/run.mjs` and `run_inputs.mjs`.
- Cost is arithmetic on reported usage times list prices and is labelled as such. Day 1 spend of about $0.80 is an estimate, not from the billing page.
- Re-run recipe: load `.env` without printing it, then run each script as shown in the repo guide.

**Evidence:** [SPIKES.md intro](../docs/SPIKES.md), [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py), [../spikes/sam/api_sam.py](../spikes/sam/api_sam.py), [../spikes/redaction/run.mjs](../spikes/redaction/run.mjs), [MEMORY.md daily log](../docs/MEMORY.md)

### Q: What did the spikes change in the plan?

**Short answer:** [Decided] Five things: the model's confidence is not usable on its own, so I planned a verifier and an `unsure` UX. SAM does not improve click accuracy, so it is a highlight tool only. SAM is prompted with a box and agreement-gated. Pixel input-field redaction is cut to stretch. Minimal reasoning effort became the default.

**Detail:**
- Confidence: 0.95 to 0.98 on every hit leads to the calibration plan and verifier (ARCHITECTURE 5.5, R2).
- SAM: refinement raw 10/30 versus refined 11/30; model box IoU 0.57 versus SAM box 0.51 versus point 0.41 leads to box prompt, agreement gate, never move the click.
- Redaction: input heuristic 7/11 with 6 false positives and 0/3 in dark mode leads to a mandatory review screen with brush and tap-to-blur.
- Latency: p50 2,809 ms at minimal versus 5,485 ms at default with the same 10/10 leads to D1.
- Two-call step and progressive rendering came from the latency numbers (R4).

**Evidence:** [SPIKES.md summary](../docs/SPIKES.md), [MEMORY.md D1 to D6](../docs/MEMORY.md), [RISKS.md R2, R4, R5](../docs/RISKS.md)

### Q: Why did you test SAM locally first, and what changed?

**Short answer:** [Measured] SAM 3 and 3.1 open weights are gated and the official repo assumes CUDA, so I first used local SAM 2.1 tiny (Apache-2.0) as a stand-in on the M5. Then I found the Meta API serves SAM 3.1 and re-ran the same tests through it.

**Detail:**
- Local SAM 2.1 tiny: 209 ms warm on MPS, 88% whole-element with single-mask output (42/48), but 17% with a bad "largest candidate" selection policy. That shows selection policy matters.
- API SAM 3.1: 73% (22/30) whole-element, p50 1,338 ms. It is the same kind of off-centre-click test, but with 30 clicks instead of 48, so compare the two with care.
- Outcome: SAM 3.1 through the API, local SAM 2.1 kept only as the eval fallback.
- `policies.py` tested four candidate-selection policies and an oracle ceiling on the same 48 seeded clicks.

**Evidence:** [SPIKES.md (a) and (c)](../docs/SPIKES.md), [../spikes/sam/policies.py](../spikes/sam/policies.py), [../spikes/sam/jitter.py](../spikes/sam/jitter.py), [../spikes/sam/screenspot_sam.py](../spikes/sam/screenspot_sam.py)

### Q: What is the daily plan?

**Short answer:** [Planned] Eight days, with evaluation early so a bad result still leaves time to react. Day 1 verify and plan; Day 2 backend core and eval skeleton; Day 3 evaluation and redaction; Day 4 core loop and first deploy; Day 5 share, accessibility, E2E; Day 6 fix and landing page; Day 7 hardening and freeze; Day 8 ship.

**Detail:**
- Feature freeze Mon Nov 2, 23:59 London. Internal deadline Tue Nov 3, 23:59. Buffer Nov 4, target submission by 18:00 London. Official deadline Thu Nov 5, 02:00 London.
- Day 1 definition of done is not fully met: founder approval of the plan and answers to the top questions are still blocking.
- Day 3 has a decision checkpoint on effort level, Wonder escalation and the verifier.
- Day 4 deliverable: public URL with the core loop and the PRIV-1 test green in CI.
- Each day ends with tick-boxes, a MEMORY.md daily entry and a step-log update.

**Evidence:** [PHASES.md](../docs/PHASES.md), [MEMORY.md daily log](../docs/MEMORY.md)

### Q: Why is evaluation on Day 3 and deploy on Day 4?

**Short answer:** [Decided] So that a bad accuracy, latency or hosting result still leaves three to four days to react. The ordering is deliberate risk-first planning.

**Detail:**
- The core loop works end to end on Day 4; everything after is polish, sharing and evidence.
- Hosting constraints (Vercel body and time limits) are UNVERIFIED, so deploying on Day 4 and not Day 5 gives a day to move to Render or Cloud Run.

**Evidence:** [PHASES.md header](../docs/PHASES.md), [RISKS.md R7](../docs/RISKS.md)

### Q: What is in the risk register?

**Short answer:** [Decided] Eight top risks, each with evidence today, a mitigation and a pre-agreed kill or pivot rule: R1 accuracy on dense UIs, R2 uncalibrated confidence, R3 redaction misses, R4 latency, R5 SAM adds little, R6 credit burn or abuse, R7 hosting constraints, R8 solo scope and unknown submission rules.

**Detail:**
- Likelihood and impact are rated H, M or L. R2 and R3 are high likelihood and high impact. R1, R6, R8 are medium likelihood and high impact.
- Reviewed at the end of every day.
- Watch list below the top 8: prompt injection, harmful goals, live sites changing, model updates, standard-mode retention, licences.

**Evidence:** [RISKS.md](../docs/RISKS.md)

### Q: What are your kill criteria, and why decide them now?

**Short answer:** [Decided] Written before the results so a bad number triggers a plan, not a debate. Examples: v2 held-out under 75% or Pro under 25% triggers a model switch or a narrower pitch; spend at $110 triggers demo mode; Day 4 slipping past Oct 31 midnight cuts all stretch work.

**Detail:**
- R2: AUROC below 0.65 and verifier lift under 5 points means drop confidence from the UI.
- R3: review time over 45 s on average means add a one-tap "hide all text in boxes". Never remove the review.
- R4: production p95 over 8 s means a smaller image; SAM p95 over 4 s means opt-in outline.
- R7: Vercel limits fail on Day 4 means move the Docker image the same day.

**Evidence:** [RISKS.md](../docs/RISKS.md), [PHASES.md cut list](../docs/PHASES.md)

### Q: What are the working rules for agents and for you?

**Short answer:** [Decided] Read the rules and today's checklist first, find the requirement ID your change serves, update the docs in the same commit as the code, never print secrets, never fake results, and run the pre-push pruning review before every commit.

**Detail:**
- No requirement ID means not in scope: add it to MEMORY.md as a proposal first.
- Conventional Commits with requirement IDs; short-lived branches; CI green before merge.
- Tests are named after requirement IDs. A bug fix starts with a failing test.
- A change that weakens a privacy rule needs an explicit founder decision in MEMORY.md.

**Evidence:** [RULES.md sections 0, 3 to 8](../docs/RULES.md), [../CLAUDE.md](../CLAUDE.md)

### Q: What setbacks did you hit on Day 1?

**Short answer:** [Measured] Gated SAM weights and CUDA-only code, no Meta API key at first, a renamed dataset and flaky dataset API responses, and an unreliable pixel heuristic for input fields.

**Detail:**
- S1 found no Meta API key, Hugging Face login or partner keys in the environment, so the API spikes were blocked on me until the key was provided.
- `fetch_samples.py` retries sporadic 502 errors and timeouts from the Hugging Face datasets server, and notes the ScreenSpot dataset id had been renamed.
- The input-field heuristic scored 7/11 with 6 false positives, so I cut it.
- Smoke-test data: 10 samples are small, so I did not treat it as proof.

**Evidence:** [.learnings/00-step-log.md S1 and S3](00-step-log.md), [../spikes/grounding/fetch_samples.py](../spikes/grounding/fetch_samples.py), [SPIKES.md (d)](../docs/SPIKES.md)

### Q: How do you keep the docs and code from drifting?

**Short answer:** [Decided] Docs win until a decision in MEMORY.md changes them, and the doc is updated in the same commit as the code. Step-log entries and these Q&A files are updated whenever a spike, eval run, deploy or decision changes an answer.

**Detail:**
- MEMORY.md has a decision log, assumptions table, open questions and a daily log, append-only with superseding entries.
- OpenAPI drift fails CI, and requirement IDs tie tests to docs.
- The status of every decision in MEMORY.md is still "Proposed" until I approve the plan.

**Evidence:** [RULES.md sections 0 and 7](../docs/RULES.md), [MEMORY.md](../docs/MEMORY.md), [REQUIREMENTS.md API-8](../docs/REQUIREMENTS.md)

### Q: What would you do differently?

**Short answer:** [Known limitation] Four things I already know. Test the production prompt and schema, not a simpler spike prompt. Use more than 10 samples. Check spend against the billing page instead of relying on an estimate. Keep research findings in the repo (the Benchmarks section of SPIKES.md now does this) so decisions cite evidence that can be checked.

**Detail:**
- The spike's schema was `target_visible`, `point`, `bbox`, `confidence`, while the production schema has `status` and ten other fields. Day 2 on the dev split is the first run of prompt v1.
- n = 10 on ScreenSpot v1 is a smoke test. The Day 3 runs are the real test.
- Day 1 spend of about $0.80 is an estimate from usage times the price table.
- These are my own reflections from reading the docs. Replace or extend them with real reflections from the build.

**Evidence:** [../spikes/grounding/smoke.py](../spikes/grounding/smoke.py), [ARCHITECTURE.md section 5.3](../docs/ARCHITECTURE.md), [SPIKES.md (b)](../docs/SPIKES.md), [MEMORY.md daily log](../docs/MEMORY.md)

### Q: What is built today, honestly?

**Short answer:** [Measured] Four verification spikes and nine planning documents. No application code: no web app, no API, no eval harness, no deploy.

**Detail:**
- Day 1 tasks done: spikes (a) to (d) with evidence, docs, step log. Not done: founder approval, answers to the top questions, `git init` and the public repo, and the Q&A review.
- CLAUDE.md says: "Application code does not exist yet (awaiting plan approval)".
- Spike code is throwaway and never imported by the product.

**Evidence:** [PHASES.md Day 1](../docs/PHASES.md), [../CLAUDE.md](../CLAUDE.md), [SPIKES.md intro](../docs/SPIKES.md)
