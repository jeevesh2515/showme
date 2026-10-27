# 01 Product and problem

Purpose: answer "what is ShowMe, who is it for, and why does it exist" with only facts from the docs. Tags are explained in [README.md](README.md). As of 2026-10-27 nothing here is built; the product is a design backed by Day 1 spikes.

### Q: What does ShowMe do, in one sentence?

**Short answer:** [Decided] ShowMe turns a screenshot and a goal, like "cancel my subscription", into step-by-step visual instructions drawn on the user's own screen, without the raw screenshot ever leaving their device.

**Detail:**
- One step at a time: one action, one highlighted element, one sentence.
- The user stays in control. ShowMe points, the person taps.
- The privacy promise is architectural: redaction runs in the browser, and the server has no path that accepts an unredacted image.
- Today the building blocks are spiked (model grounding, SAM outline, client-side redaction). The app is not built.

**Evidence:** [PRD.md section 1](../docs/PRD.md), [PRD.md section 4](../docs/PRD.md), [SPIKES.md summary](../docs/SPIKES.md)

### Q: What problem does it solve?

**Short answer:** [Decided] Important actions in apps are hidden behind menus that differ per product and change often, and the help people can get today is not grounded in their actual screen and is not private.

**Detail:**
- Three bad options today: ask a relative (slow, "the three dots, top right, no, the other one"), search a help article (generic, out of date, written for another device or version), ask a general chatbot (answers in text about a screen it cannot see, then asks for a screenshot full of email and card digits).
- The gap I name is two-sided: help is not grounded in the user's real screen, and tools that can see the screen are not private by default.
- I have not measured how often these situations happen. The claim that "how do I" questions are a large share of support contacts is an unsourced assumption (A9).

**Evidence:** [PRD.md section 2](../docs/PRD.md), [MEMORY.md A9](../docs/MEMORY.md)

### Q: Who is the user?

**Short answer:** [Decided] The primary user is a stuck, often older or less confident person with one device and one goal. The secondary user is the helper relative. The future buyer is a support lead at a consumer company, and that last one is a hypothesis.

**Detail:**
- Primary persona: Ken, 77, wants to stop a streaming subscription. Low patience for jargon, worried about scams and "pressing the wrong thing".
- Secondary persona: Priya, his daughter, two hours away. She wants to fix it once, so she can create a shareable guide that expires on its own.
- Out of scope: enterprise IT admins, and screen-reader-only users who need full non-visual navigation of third-party apps. We support screen readers for our own UI.
- These personas are illustrative. I have not interviewed any users yet.

**Evidence:** [PRD.md section 3](../docs/PRD.md)

### Q: Why not just ask a general chatbot like ChatGPT or Claude?

**Short answer:** [Decided] A general chatbot answers in words, guesses at a screen it cannot see, and to see it you upload a screenshot with your private details. ShowMe grounds the answer on the actual screen and hides private details first, on your device.

**Detail:**
- ShowMe returns a position on the screenshot (a box and, when it agrees, an exact outline), not a paragraph.
- It has explicit honest states for "not visible", "unsure" and "refuse", instead of answering confidently regardless.
- I have not run a head-to-head comparison against any chatbot. I would not claim ShowMe is more accurate than one. The claim is about grounding and privacy by construction.

**Evidence:** [PRD.md section 2 and 4](../docs/PRD.md), [SPIKES.md (b)](../docs/SPIKES.md)

### Q: Walk me through exactly what the user sees.

**Short answer:** [Decided] Add a screenshot and a goal, check a privacy review screen, see one highlighted step with one sentence, do it, add the next screenshot, repeat until done.

**Detail:**
- Start screen: goal input (up to 300 characters) and a drop zone for upload, paste or drag. PNG, JPEG or WebP up to 20 MB.
- Privacy check (mandatory): auto-hidden regions shown, tap any text line to hide it, brush, undo, zoom, then "Looks private. Continue".
- Looking at your screen: progress text ("Looking at your screen", "Finding the button", "Drawing the outline"), cancel button, a "taking longer than usual" message after 10 seconds.
- Step view: numbered ring on the screenshot plus the instruction, "Read it to me", "I did it, next", "That didn't work", "Start over".
- Done screen with an optional Share.

**Evidence:** [DESIGN.md section 4](../docs/DESIGN.md), [REQUIREMENTS.md FLOW-1 to FLOW-13](../docs/REQUIREMENTS.md)

### Q: What are the product principles, and which one matters most?

**Short answer:** [Decided] Five: private by construction, one step at a time, honest over clever, earn trust with numbers, no account needed. Private by construction is the one that cannot be traded away.

**Detail:**
- Privacy requirements PRIV-1 to PRIV-9 are non-negotiable and any failure blocks release.
- "Earn trust with numbers" means public, reproducible eval results including the ones that look bad.
- RULES.md section 2 backs this: every published number comes from a generated results file, bad results get the same prominence as good ones.

**Evidence:** [PRD.md section 4](../docs/PRD.md), [REQUIREMENTS.md privacy table](../docs/REQUIREMENTS.md), [RULES.md sections 1 and 2](../docs/RULES.md)

### Q: What does "honest" mean in the product?

**Short answer:** [Decided] ShowMe has distinct states for when it cannot or should not guess: `not_visible`, `unsure`, `done` and `refuse`, and it never highlights a guess silently.

**Detail:**
- `not_visible`: no highlight, the model's hint, and a scroll arrow if scrolling would reveal it.
- `unsure`: dashed highlight, "?" badge, text "I think it is this one. Check before you tap."
- `refuse`: calm explanation, no highlight, for goals that harm someone or bypass security or payment controls.
- Measured so far: 5/5 honest "not visible" answers on 5 absent-target probes. Known gap: the model's confidence is not informative (0.95 to 0.98 on every hit), so the "unsure" decision needs the verifier plan.

**Evidence:** [DESIGN.md section 3](../docs/DESIGN.md), [SPIKES.md (b)](../docs/SPIKES.md), [ARCHITECTURE.md section 5.5](../docs/ARCHITECTURE.md)

### Q: What is in the MVP, what is stretch, and what is cut?

**Short answer:** [Decided] The MVP is the full loop with redaction, honest states, SAM outline, opt-in sharing, accessibility, rate limits, landing page and eval harness. Stretch is voice, Wonder escalation, crop-and-re-ground and more. Cut is anything that acts for the user or captures the screen automatically.

**Detail:**
- MVP must ship by the feature freeze, Nov 2 23:59 London.
- Stretch, in order: spoken goal, Muse Wonder "try harder", crop-and-re-ground for tiny targets, pixel input-field detection for redaction, more OCR languages, embeddable widget demo page.
- Cut: browser extension or desktop app with automatic capture, live screen sharing or video, taking actions for the user, accounts and saved history, native mobile apps, self-hosting open-weights models.
- Cut order if behind is written in PHASES.md. Privacy, eval honesty reporting, the public URL and the README limitations section are never cut.

**Evidence:** [PRD.md section 5](../docs/PRD.md), [PHASES.md cut list](../docs/PHASES.md)

### Q: Why screenshots? Why not a browser extension or live screen sharing?

**Short answer:** [Decided] Screenshots keep the user in control of exactly what is shared, and they avoid the privacy and review burden of something that watches the screen.

**Detail:**
- An extension or desktop app that captures automatically was explicitly cut.
- The cost is friction: the user has to take a screenshot, add it, and repeat for the next step. The start screen has a "How do I take a screenshot?" help link for iPhone, Android, Windows and Mac.
- The web app works in mobile browsers, but I have not tested the phone workflow of switching between the app being helped and ShowMe.

**Evidence:** [PRD.md section 5.3](../docs/PRD.md), [DESIGN.md section 4.1](../docs/DESIGN.md)

### Q: Why does ShowMe never click or type for the user?

**Short answer:** [Decided] Guidance, not action. It keeps liability and prompt-injection impact low, and it keeps the person in control of a frightening interface.

**Detail:**
- The system prompt says "The person performs the action, not you".
- Because ShowMe never executes anything, an injected instruction on screen can at most produce a bad suggestion, which the honesty UX and the caution field limit.
- The cost: no automation value for people who cannot operate the interface at all.

**Evidence:** [PRD.md section 5.3](../docs/PRD.md), [ARCHITECTURE.md sections 5.2 and 12](../docs/ARCHITECTURE.md)

### Q: Why no account or login?

**Short answer:** [Decided] The core flow needs nothing stored about the user, so there is nothing to sign in to and nothing to leak. Principle 5 is "no account needed".

**Detail:**
- Accounts, login, payment and saved history are on the cut list.
- Nothing persists beyond the tab unless the user opts in to Share.
- Consequence for limits: with no accounts, abuse control relies on per-IP limits and a global spend cap, not per-user quotas.

**Evidence:** [PRD.md section 4 and 5.3](../docs/PRD.md), [REQUIREMENTS.md PRIV-4](../docs/REQUIREMENTS.md)

### Q: What is the "Share guide" feature and why does it exist?

**Short answer:** [Decided] After a task is done, the user can opt in to share the redacted step images and text behind an unguessable link that deletes itself after 7 days. It is for the helper relative who wants to fix it once.

**Detail:**
- Requires an explicit consent checkbox and a second review of every image.
- Creator gets a delete link. Up to 15 steps.
- Supabase is used only for this and for rate-limit counters.
- If I am behind, share images are cut first and text-only guides kept.

**Evidence:** [PRD.md section 5.1 item 8](../docs/PRD.md), [REQUIREMENTS.md PRIV-5](../docs/REQUIREMENTS.md), [ARCHITECTURE.md section 8](../docs/ARCHITECTURE.md), [PHASES.md cut list](../docs/PHASES.md)

### Q: How do you know it works?

**Short answer:** [Planned] I do not know yet at the level that matters. On Day 1 I measured 10/10 on a ten-sample smoke test, which is a smoke test, and the real evidence comes from ScreenSpot-v2, ScreenSpot-Pro, a negatives suite and a 20-task end-to-end suite on Days 3 to 6.

**Detail:**
- Targets, which are goals and not results: >= 85% on ScreenSpot-v2, >= 40% on ScreenSpot-Pro, >= 90% absent-target honesty, >= 70% E2E task success, p50 <= 3.5 s and p95 <= 7 s server-side, <= $0.01 per step, 0 raw-image upload incidents.
- Day 3 has a decision checkpoint: if v2 held-out is below 75% or Pro below 25%, I switch to Muse Wonder if it is at least 10 points better, otherwise narrow the pitch.
- The results will be reported whatever they are.

**Evidence:** [PRD.md section 6.1](../docs/PRD.md), [RISKS.md R1](../docs/RISKS.md), [PHASES.md Day 3](../docs/PHASES.md)

### Q: What is your founder story?

**Short answer:** [Hypothesis] The docs contain a draft narrative about family members calling me for help with apps. It is only usable if it is true, and the docs themselves say to adjust it.

**Detail:**
- The draft says my job is building AI systems that ground answers in real evidence, and that I built ShowMe on Muse Spark for grounding and SAM 3.1 for the outline.
- Open question Q7 asks me whether the "family calls me" story is true, and RULES section 2 forbids fabricated claims.
- Before I say it to anyone, I replace it with what really happened to me.

**Evidence:** [PRD.md section 7](../docs/PRD.md), [MEMORY.md Q7](../docs/MEMORY.md)

### Q: Why is it built on Meta models?

**Short answer:** [Decided] It is a Meta hackathon project and the Meta Model API provides everything the loop needs: Muse Spark 1.3 for grounding and SAM 3.1 for outlines, behind one API, with a $150 credit.

**Detail:**
- Muse Spark takes images, supports JSON-schema output and reasoning-effort control. SAM 3.1 is served by the same API.
- Built on Meta models is a stated constraint (PRD section 9). D3 calls SAM a required Meta model.
- I did not benchmark non-Meta models, so I make no claim that these are the best choice, only that they fit the constraints and measured well enough to proceed.

**Evidence:** [SPIKES.md (a)](../docs/SPIKES.md), [PRD.md section 9](../docs/PRD.md), [MEMORY.md D3](../docs/MEMORY.md)

### Q: What languages and platforms does it support?

**Short answer:** [Known limitation] UK English only for the MVP, proposed and awaiting my confirmation. Desktop, web and mobile screenshots are in the benchmark plan. Other languages are stretch.

**Detail:**
- The OCR used for redaction is English traineddata, self-hosted. More OCR languages are stretch S5.
- The request carries a `locale` field (example `en-GB`).
- Grounding on non-English interfaces is untested. Redaction recall on non-English text is a named risk (R3).

**Evidence:** [MEMORY.md Q9](../docs/MEMORY.md), [PRD.md section 5.2](../docs/PRD.md), [RISKS.md R3](../docs/RISKS.md), [ARCHITECTURE.md section 7](../docs/ARCHITECTURE.md)

### Q: What does success look like for the submission?

**Short answer:** [Planned] A public URL live by end of Day 4 (Oct 30), a 2 to 3 minute demo video from the live product, a README with one-command setup and eval reproduction, and a public repo with green CI.

**Detail:**
- Internal deadline Tue Nov 3 23:59. Official deadline Wed Nov 4, 21:00 EST, which is Thu Nov 5, 02:00 London. Target submission Nov 4 by 18:00 London.
- Submission format (video length, repo, URL requirements) is not published on the pages I read: UNVERIFIED, still an open question (Q4).
- Track decided 2026-10-27 (MEMORY D14): **Indie**. Startup was the recommendation; confirm Indie criteria against the Official Rules (Q4).

**Evidence:** [PRD.md section 6.2](../docs/PRD.md), [PHASES.md header](../docs/PHASES.md), [MEMORY.md Q3 and Q4](../docs/MEMORY.md), [SPIKES.md (a)](../docs/SPIKES.md)
