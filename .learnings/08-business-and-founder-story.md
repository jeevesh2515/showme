# 08 Business and founder story

Purpose: answer business, market and founder questions without inventing evidence. Tags are explained in [README.md](README.md). Everything about the business is a hypothesis. The docs contain no customer interviews, no market sizing and no competitor study, so the answers say that.

### Q: What is the business, in one sentence?

**Short answer:** [Hypothesis] The consumer app proves the experience and gathers evidence, and the business is "ShowMe for your help centre": an embeddable widget that guides a company's customers on their own screen so they do not open a support ticket.

**Detail:**
- The consumer app is free and rate limited.
- The widget demo page is a stretch item, static, with no backend changes.
- This is a hypothesis to test, not a fact. The PRD labels section 8 that way.

**Evidence:** [PRD.md section 8](../docs/PRD.md), [PRD.md section 5.2](../docs/PRD.md)

### Q: Who pays?

**Short answer:** [Hypothesis] A support lead at a consumer company with "how do I" ticket volume. The user of the consumer app does not pay.

**Detail:**
- The docs name the future buyer as a hypothesis in the PRD users table.
- The assumptions listed: how-do-I questions are a large share of consumer support contacts; a guided step on the user's own screen resolves more of them than a static article; companies already pay per resolution for AI support tools, so per-step pricing is familiar.
- Each is an assumption to test. The first is unsourced (A9) and I must find a cited source before putting it in a pitch.

**Evidence:** [PRD.md sections 3 and 8](../docs/PRD.md), [MEMORY.md A9](../docs/MEMORY.md)

### Q: What is the pricing?

**Short answer:** [Hypothesis] Consumer free. Starter widget GBP 99 a month with 5,000 guided steps, branding and analytics. Growth at GBP 0.03 per step over the plan plus custom caution rules. Enterprise custom, with a DPA, SSO, data residency and an option to run Muse Spark Open on the customer's cloud.

**Detail:**
- None of this has been validated with a customer.
- Muse Spark Open is an open-weights Meta model hosted by third-party providers (SPIKES (a)). Self-hosting it is too large for a hackathon, so it is only the enterprise "run it in your own cloud" story. Its grounding quality compared with the hosted model is UNVERIFIED, so I would not promise it.
- DPA, SSO and data residency are not built or designed in the docs.

**Evidence:** [PRD.md section 8](../docs/PRD.md), [SPIKES.md (a)](../docs/SPIKES.md)

### Q: What are the unit economics?

**Short answer:** [Hypothesis] On the measured cost of about $0.0076 per step, the Starter plan's 5,000 steps cost about $38 in API fees (about GBP 30), which is roughly a 70% gross margin before hosting.

**Detail:**
- $0.0076 is one grounding call (about $0.0051) plus one SAM call ($0.0025), an estimate from usage tokens and list prices.
- Not included: hosting, support, sales, verifier pass (about +$0.002 per step if enabled) and any Meta price changes.
- The Growth overage of GBP 0.03 per step is about 5x API cost (about GBP 0.006 per step, from the GBP 30 per 5,000 steps).

**Evidence:** [PRD.md section 8](../docs/PRD.md), [SPIKES.md cost section](../docs/SPIKES.md)

### Q: How do you validate the business?

**Short answer:** [Planned] Two sets of metrics. Consumer: task success rate (E2E and live "it worked" taps), 7-day return rate, share-guide rate. Widget pilot: ticket deflection (sessions ending `done` with no ticket in 24 hours), cost per resolved session versus the company's cost per ticket, and CSAT on guided sessions.

**Detail:**
- None of those are measured today. The hackathon only produces the consumer evidence and the benchmark results.
- Pilot requires a partner company. I do not have one in the docs.
- The honest status: the business case is an argument, not data.

**Evidence:** [PRD.md section 8](../docs/PRD.md)

### Q: What would make you stop?

**Short answer:** [Decided] Pre-agreed kill signals. For the business: if live success stays under 50% or pilot deflection under 10% after iteration, the widget thesis fails. For the product: v2 held-out under 75% or Pro under 25% at the Day 3 checkpoint triggers a model switch or a narrower pitch.

**Detail:**
- Other pre-agreed triggers: confidence AUROC below 0.65 and the verifier lifting precision by less than 5 points, review time over 45 s on average, production step p95 over 8 s, total spend at $110, Day 4 slipping past Oct 31 midnight.
- Writing them before the results is deliberate, so I do not argue myself out of a bad number.

**Evidence:** [PRD.md section 8](../docs/PRD.md), [RISKS.md R1 to R8](../docs/RISKS.md)

### Q: Who are your competitors?

**Short answer:** [Known limitation] I have not done a competitor study and the docs name no competing product. What the docs have is a comparison with the three alternatives a stuck person has today: ask a relative, search a help article, or ask a general chatbot.

**Detail:**
- My differentiation claims are about grounding on the user's actual screen and private-by-construction handling, plus public reproducible numbers.
- I have no evidence that incumbents cannot do the same. If asked, I should say I would do that research next, not assert a moat.
- Do not use market-size or competitor claims unless sourced.

**Evidence:** [PRD.md section 2](../docs/PRD.md), [MEMORY.md A9](../docs/MEMORY.md)

### Q: What is your moat?

**Short answer:** [Hypothesis] I do not claim a technical moat. The things I am building that are hard to copy quickly are the trust story (privacy by construction, a public eval that reports failures) and, if the widget thesis holds, integration into companies' help centres.

**Detail:**
- The model capabilities come from Meta's API, which anyone can call. The measured model accuracy is not mine to claim as unique.
- The reproducible eval harness and the redaction pipeline are what I write.
- Whether trust and distribution become a moat is untested.

**Evidence:** [PRD.md section 4 and 8](../docs/PRD.md), [SPIKES.md (a)](../docs/SPIKES.md)

### Q: Why now?

**Short answer:** [Measured] What is new, based on the spikes: a hosted model that returns usable coordinates and honest "not visible" answers at interactive latency (p50 2,809 ms at about $0.0051 a call), plus a segmentation model served by the same API.

**Detail:**
- My evidence for "why now" is technical, from the spikes. Broader market claims (consumer behaviour, funding trends) are not in the docs and I should not make them.
- This is a hackathon build, and the timing is also driven by the event.
- ScreenSpot v1 is near-saturated by modern models, which is itself a sign the capability exists, though v2 and Pro will say how strong it is.

**Evidence:** [SPIKES.md (a) and (b)](../docs/SPIKES.md)

### Q: Why would a company trust you with their customers' screens?

**Short answer:** [Hypothesis] Because the design means I never receive a raw screenshot, nothing is stored unless the user shares, and the evaluation is public. It is the privacy architecture that makes the pitch credible, which is why redaction quality matters so much.

**Detail:**
- Honest gap: redaction misses free text, and Meta retention is UNVERIFIED. An enterprise buyer would ask about both.
- The enterprise tier lists a DPA, data residency and running a model in the customer's cloud as ideas. None are built.

**Evidence:** [PRD.md sections 4 and 8](../docs/PRD.md), [SPIKES.md (a) and (d)](../docs/SPIKES.md), [RISKS.md R3](../docs/RISKS.md)

### Q: Why a consumer app first, if the money is in widgets?

**Short answer:** [Hypothesis] The consumer app proves the experience and gathers evidence, and a free public demo is what a hackathon can judge. It also gives me the numbers a company would ask for.

**Detail:**
- The share-guide feature gives a helper-relative use case ("fix it once and not again next month") that is also a distribution loop.
- Risk: consumer product and widget product are different, and the consumer app alone has no revenue.
- Track decided 2026-10-27 (MEMORY D14): **Indie**. Startup was the recommendation; Indie criteria still to confirm against the Official Rules (Q4).

**Evidence:** [PRD.md sections 3 and 8](../docs/PRD.md), [MEMORY.md Q3](../docs/MEMORY.md)

### Q: What is the founder story, and is it true?

**Short answer:** [Hypothesis] The draft in the PRD says my work is building AI systems that ground answers in real evidence, that family members keep calling me with "what do I press?", and that every tool either explained in words what it could not see or asked for a risky screenshot. The docs say to adjust the personal details so they are true.

**Detail:**
- I must replace this with my real story. The note is explicit: the narrative must be made true by the founder (MEMORY Q7, PRD section 7).
- The demo video script uses "My dad called again", which needs the same check. No real accounts on screen and consent for any relative who appears (Q8).
- Never invent a customer story, quote or number to fit the narrative.

**Evidence:** [PRD.md section 7](../docs/PRD.md), [MEMORY.md Q7 and Q8](../docs/MEMORY.md), [DESIGN.md section 7](../docs/DESIGN.md)

### Q: Why is this a good project for a solo founder?

**Short answer:** [Decided] The scope is shaped for one person: use hosted models instead of training or hosting, a stateless backend, free tiers, a strict cut list, and daily definitions of done.

**Detail:**
- Budget is zero out of pocket: the $150 Meta credit covers model calls, Vercel and Supabase free tiers cover hosting.
- All code is written during the hackathon (Oct 27 to Nov 4), with no code copied from previous repos.
- Risk R8 names the scope and time risk, with the cut list and a Day 4 trigger.

**Evidence:** [PRD.md section 9](../docs/PRD.md), [PHASES.md](../docs/PHASES.md), [RISKS.md R8](../docs/RISKS.md)

### Q: Which track did you enter, and how do you fit it?

**Short answer:** [Decided] Indie, decided 2026-10-27 (MEMORY D14). Startup was the recommendation because its criteria are technical execution and production readiness; the founder chose Indie. My plan still puts weight into evaluation, privacy tests, CI, a spend cap and a public URL by Day 4, which helps in either track.

**Detail:**
- Solo founders can enter (A10, supported, confirm in the Official Rules).
- The submission format (video length, repo, URL) is not published on either page: UNVERIFIED (Q4).
- Indie judging criteria must be confirmed against the Official Rules on Day 2 (Q4) before the pitch is finalised.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md), [MEMORY.md A10, Q3, Q4](../docs/MEMORY.md)

### Q: What is the first thing you would do after the hackathon?

**Short answer:** [Hypothesis] Test the riskiest business assumption: that a guided step on the user's screen resolves more "how do I" contacts than a static article, with one real pilot, and find a cited source for how large that share is.

**Detail:**
- A9 is the unsourced assumption I would research first.
- Pilot success is the deflection and CSAT metrics, with the kill signals above.
- In parallel, fix whatever the Day 3 and Day 6 evidence shows is weakest, and ask Meta about standard-mode retention.

**Evidence:** [PRD.md section 8](../docs/PRD.md), [MEMORY.md A9](../docs/MEMORY.md), [RISKS.md watch list](../docs/RISKS.md)

### Q: Is this a feature or a company?

**Short answer:** [Hypothesis] I do not know. As a consumer app it looks like a feature of a bigger assistant. As an embeddable, privacy-first guide with a public eval for companies, it could be a product. The pilot decides.

**Detail:**
- The docs make no claim either way, and I would not claim one.
- The most honest framing: a well-measured proof of concept with a testable business hypothesis.

**Evidence:** [PRD.md section 8](../docs/PRD.md)
