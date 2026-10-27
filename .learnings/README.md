# ShowMe interview and judging prep

Purpose: let me answer any question from a judge, investor, interviewer or recruiter about ShowMe, truthfully, in my own words.

Written on 2026-10-27 (Day 1 of 8). At that point only the Day 1 spikes and the planning docs exist. No application code is built. Every answer in this folder is tagged so I never present a plan as a result.

## How to use this folder

1. Read this file first, then learn the 30-second and 2-minute pitches until I can say them without notes.
2. Memorise the "numbers to remember" table. Say them exactly as written. Do not round them and do not add new ones.
3. Before any interview or demo, read the Q&A file for the topic and the matching part of `10-hard-questions.md`.
4. Each answer has a **Short answer** (say it out loud), **Detail** (backup bullets) and **Evidence** (where the claim comes from). If a judge asks "how do you know?", point to the Evidence line.
5. Update rule (RULES.md section 7): when a spike, eval run, deploy or decision changes an answer, edit the answer in the same sitting and add a step-log entry. On Day 8, replace every "planned" number with the real number from `eval/results/RESULTS.md`, or say "not run".
6. Do not edit `00-step-log.md` from here. It is the chronological record.

## Answer tags (always at the start of the short answer)

| Tag | Meaning | What I may say |
| --- | --- | --- |
| [Measured] | A Day 1 spike script produced this number. | "We measured...", with the sample size. Always add that n is small when it is. |
| [Decided] | A design decision written in the docs. Not built yet. Most are still "Proposed" in MEMORY.md until I approve the plan. | "I decided...", "The design is...". Never "it does". |
| [Planned] | A task in PHASES.md with a date. | "On Day 3 I will run...". Never claim a result. |
| [Hypothesis] | A business belief with no evidence yet. | "My hypothesis is...". Name how it would be tested. |
| [Known limitation] | A gap I already know about, or a thing the docs mark UNVERIFIED. | Say it before the judge finds it. |

## The one-sentence honesty statement

"Today I have verified the building blocks with small spikes and written the design and the evaluation plan. The real accuracy numbers come from the full benchmark runs on Day 3, and I will publish them whatever they are."

## 30-second pitch (spoken; it describes the design, so use it as "the design" until the app is built)

"Apps hide important actions, like cancelling a subscription, behind menus that differ per product. People get stuck and phone a relative, who cannot see their screen. ShowMe takes a screenshot and a goal, and draws one highlighted step at a time on the user's own screen. The private details, emails, phone numbers and card numbers, are hidden in the browser before anything is uploaded, and the user checks that on a review screen. It finds each step with Meta's Muse Spark and draws the exact outline with SAM 3.1. When it is not sure, it says so instead of guessing. And I will publish the benchmark results, including the weak ones."

## 2-minute pitch (spoken)

"Picture Ken, 77. He wants to stop a streaming subscription he no longer uses. The cancel button is three menus deep, and it is not where the help article says. So he phones his daughter Priya, two hours away. She cannot see his screen. She says 'the three dots, top right, no, the other one'. It is slow for both of them.

The alternatives are not good either. A help article is generic and often out of date. A general chatbot answers in words about a screen it cannot see, and then asks for a screenshot full of his email and card digits. The gap is that help is not grounded in the person's actual screen, and the tools that can see the screen are not private by default.

ShowMe closes that gap. This is the design, and I will say clearly which parts are built. You add a screenshot and type your goal. Before anything leaves your device, an on-device step finds emails, phone numbers and card numbers and covers them. Then a mandatory review screen shows exactly what will be sent, and you can hide anything else with one tap or a brush. There is no skip button. The design is that the server has no code path that accepts an unredacted image, enforced by a type in the code and a network test. Those are scheduled for Days 3 and 4, so I only describe them as the design today.

Then ShowMe gives you one step: one sentence, one highlighted button. Muse Spark 1.3 reads the screen and picks the step. SAM 3.1 draws the exact outline, but only when it agrees with the model's own box. If the button is not visible, ShowMe says so and tells you where to look. If it is unsure, it shows a dashed highlight that says check before you tap. If the goal is risky, it refuses. It never clicks for you.

On Day 1 I ran four spikes. Muse Spark got 10 of 10 on a ten-sample ScreenSpot smoke test, with 5 of 5 honest 'not visible' answers, at a p50 of 2,809 ms and about $0.0051 per call. That sample is small, so the real test is the full ScreenSpot-v2 and ScreenSpot-Pro runs on Day 3. The spikes also showed two things I did not expect. The model's confidence number is useless, it was 0.95 to 0.98 on every hit, so I plan a calibration check on Day 3 and, if it confirms the gap, a verifier pass. And SAM does not improve click accuracy, it only improves the highlight, so I treat it as a highlight tool and report the ablation honestly.

A guided step costs about $0.0076. The consumer app is free and rate limited. My business hypothesis, and it is a hypothesis, is an embeddable 'ShowMe for your help centre' widget that companies pay for per guided step, to deflect support tickets. I will test that with a pilot, and I have written down the numbers that would make me stop."

## Status ledger (as of 2026-10-27)

| Area | Status |
| --- | --- |
| Meta API access, model list, limits | Measured and read from official pages (SPIKES.md a) |
| Grounding accuracy and honesty | Measured on 10 samples and 5 probes only (SPIKES.md b) |
| SAM behaviour | Measured on synthetic and 10 ScreenSpot samples (SPIKES.md c) |
| Redaction regex layer | Measured on 3 synthetic fixtures (SPIKES.md d) |
| Everything else (app, API, eval harness, sharing, accessibility, deploy) | Decided in docs, not built. Schedule in PHASES.md |
| Business model | Hypothesis |

## Numbers to remember

Say them exactly. n is the sample size. "est." means arithmetic on measured usage, not a billing statement.

| Number | What it is | Source |
| --- | --- | --- |
| 10/10 | Muse Spark 1.3 point-in-box on 10 ScreenSpot v1 samples (default and low and minimal effort). n = 10, v1 is near-saturated | [SPIKES.md (b)](../docs/SPIKES.md) |
| 5/5 | Honest "not visible" on 5 absent-target probes (low, minimal and Wonder; not run at default effort) | [SPIKES.md (b)](../docs/SPIKES.md) |
| 15/16 | Point-in-box across 10 ScreenSpot samples plus 6 synthetic targets | [SPIKES.md (b)](../docs/SPIKES.md) |
| p50 2,809 ms, max 3,555 ms | Muse Spark at minimal effort. Default effort: p50 5,485 ms, max 12,814 ms | [SPIKES.md (b)](../docs/SPIKES.md) |
| 0.95 to 0.98 | Model confidence on every hit, so confidence carries no signal | [SPIKES.md summary](../docs/SPIKES.md) |
| ~$0.0051 | Cost per grounding call at minimal effort (default ~$0.0069, Wonder ~$0.0157) | [SPIKES.md (b)](../docs/SPIKES.md) |
| 3,422 in / 195 out (142 reasoning) | Tokens per call at minimal effort | [SPIKES.md (b)](../docs/SPIKES.md) |
| 73% (22/30) | SAM 3.1 API whole-element masks (IoU >= 0.7) from off-centre clicks | [SPIKES.md (c)](../docs/SPIKES.md) |
| raw 10/30, refined 11/30 | Near-miss clicks fixed by SAM refinement (helped 1, hurt 0). Local SAM 2.1: 38% to 34% (helped 0, hurt 4) | [SPIKES.md (c)](../docs/SPIKES.md) |
| p50 1,338 ms, p95 2,454 ms | SAM 3.1 API latency over 60 calls | [SPIKES.md (c)](../docs/SPIKES.md) |
| IoU 0.57 vs 0.51 vs 0.41 | Mean IoU vs ground truth: model box, SAM box prompt, SAM point prompt (16 targets) | [SPIKES.md (c)](../docs/SPIKES.md) |
| 9/16, 7/16, 6/16 | IoU >= 0.5 for model box, SAM box prompt, SAM point prompt | [SPIKES.md (c)](../docs/SPIKES.md) |
| 10/10, 0 false positives, 154 to 375 ms | Regex redaction (email, phone, card with Luhn) on 3 synthetic fixtures, in Node on an M5 | [SPIKES.md (d)](../docs/SPIKES.md) |
| 7/11 recall, 6 false positives, 0/3 dark mode | Pixel heuristic for text inside input fields. Not reliable, cut to stretch | [SPIKES.md (d)](../docs/SPIKES.md) |
| ~$0.0076 per step (est.) | One grounding call (~$0.0051) plus one SAM call ($0.0025) | [SPIKES.md cost](../docs/SPIKES.md) |
| ~$0.04 per 5-step task (est.) | 5 x the per-step cost | [SPIKES.md cost](../docs/SPIKES.md) |
| ~19,700 steps (est.) | What the $150 credit covers before eval spend | [SPIKES.md cost](../docs/SPIKES.md) |
| 3,000 RPM, 4M TPM | Muse Spark 1.3 limits, per team not per key. SAM 3.1: 3,000 RPM | [SPIKES.md (a)](../docs/SPIKES.md) |
| $1.25 / $4.25 per 1M tokens | Muse Spark 1.3 input / output price. Wonder $4.00 / $20.00. SAM 3.1 $2.50 per 1,000 images | [SPIKES.md (a)](../docs/SPIKES.md) |
| 30/hour, 150/day per IP | Planned step rate limit. Guide creation 5/day per IP | [ARCHITECTURE.md 9](../docs/ARCHITECTURE.md) |
| $5/day, $60 total | Planned public-demo spend cap | [ARCHITECTURE.md 9](../docs/ARCHITECTURE.md) |
| ~$27 eval, ~$107 of $150 | Estimated eval spend; total plan including ~$20 development and the $60 cap | [ARCHITECTURE.md 9](../docs/ARCHITECTURE.md) |
| 7 days | Shared guide expiry. Signed image URLs last 10 minutes. Token is 22 characters (about 128 bits), only its SHA-256 is stored | [ARCHITECTURE.md 8](../docs/ARCHITECTURE.md) |
| 1920 px, JPEG q=0.85 | Client downscale and encode before upload | [ARCHITECTURE.md 7](../docs/ARCHITECTURE.md) |
| >= 85% / >= 40% / >= 90% / >= 70% | Targets (goals, not results): ScreenSpot-v2, ScreenSpot-Pro, negatives honesty, E2E success | [PRD.md 6.1](../docs/PRD.md) |
| <= 3.5 s / <= 7 s, <= $0.01 | Targets: server step latency p50 / p95, cost per step | [PRD.md 6.1](../docs/PRD.md) |
| < 75% v2 or < 25% Pro | Day 3 kill/pivot trigger for accuracy | [RISKS.md R1](../docs/RISKS.md) |
| AUROC < 0.65 | Trigger to turn on the verifier pass | [ARCHITECTURE.md 5.5](../docs/ARCHITECTURE.md) |
| GBP 99/month, 5,000 steps | Starter widget pricing hypothesis. API cost ~$38 (about GBP 30), ~70% gross margin before hosting | [PRD.md 8](../docs/PRD.md) |
| < 50% live success, < 10% deflection | Kill signals for the business thesis | [PRD.md 8](../docs/PRD.md) |
| ~$0.80 (est.) | Day 1 API spend: 71 grounding calls (15 on Wonder), 94 SAM calls | [MEMORY.md daily log](../docs/MEMORY.md) |

## Index of Q&A files

| File | Topic | Questions |
| --- | --- | --- |
| [01-product-and-problem.md](01-product-and-problem.md) | What it solves, for whom, scope, principles | 17 |
| [02-architecture-and-decisions.md](02-architecture-and-decisions.md) | Every "why X not Y" | 20 |
| [03-models-grounding-and-sam.md](03-models-grounding-and-sam.md) | Prompt, schema, post-processing, honesty gate, SAM | 17 |
| [04-privacy-and-security.md](04-privacy-and-security.md) | Redaction, brand type, sharing, CSP, injection, threat model | 21 |
| [05-rate-limits-cost-and-scale.md](05-rate-limits-cost-and-scale.md) | Limits, caps, cost arithmetic, scale | 16 |
| [06-evaluation-harness.md](06-evaluation-harness.md) | Benchmarks, metrics, ablation, E2E, reproducibility | 19 |
| [07-edge-cases-and-user-limitations.md](07-edge-cases-and-user-limitations.md) | What breaks, who struggles, what ShowMe will not do | 23 |
| [08-business-and-founder-story.md](08-business-and-founder-story.md) | Hypothesis, pricing, metrics, kill signals | 16 |
| [09-build-process-and-ai-tooling.md](09-build-process-and-ai-tooling.md) | How I built it, how claims were verified | 14 |
| [10-hard-questions.md](10-hard-questions.md) | Skeptical questions with honest answers | 29 |

## Source documents

[PRD](../docs/PRD.md) · [REQUIREMENTS](../docs/REQUIREMENTS.md) · [ARCHITECTURE](../docs/ARCHITECTURE.md) · [RULES](../docs/RULES.md) · [PHASES](../docs/PHASES.md) · [DESIGN](../docs/DESIGN.md) · [MEMORY](../docs/MEMORY.md) · [RISKS](../docs/RISKS.md) · [SPIKES](../docs/SPIKES.md) · [step log](00-step-log.md)

## Things I must make true before I say them

- The founder narrative ("my family keeps calling me") is only mine to say if it is true (PRD section 7, MEMORY Q7). Replace it with my real story.
- Any claim about older users, support-ticket share, competitors or market size is unsourced today (MEMORY A9). Do not state it as fact.
