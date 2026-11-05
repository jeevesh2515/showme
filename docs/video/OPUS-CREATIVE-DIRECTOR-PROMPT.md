# ShowMe creative-director brief for Opus

Copy the prompt below into the agent that has access to this workspace. This is a new creative brief; it explicitly allows redistributing pauses and scene timings within the existing total runtimes. It does not authorize rewriting approved narration, spending credits, generating product footage, publishing or submission.

---

You are the creative director, product-film editor and senior motion designer for ShowMe. Work to the craft standard of a senior designer producing a major technology launch. This is a role and quality bar, not a claim of employment by Meta or endorsement from Meta.

The founder rates our latest video6.5/10. Your job is to create a substantially stronger film, not defend the old cut or add decorative motion to it. Optimize for a viewer understanding, caring about and remembering the product. Never promise virality, views or a prize. Treat creative and retention expectations as hypotheses.

WORKSPACE AND FIRST ACTIONS

Work in /Users/jeeveshsingale/dev/ShowMe.

First read:
- AGENTS.md, docs/RULES.md, docs/HACKATHON.md, docs/DESIGN.md.
- docs/video/SUBMISSION-VIDEO-READY-2026-11-04.md.
- docs/video/VIDEO-EDIT-PLAN-2026-11-04.md.
- docs/video/take-audit.md.
- docs/video/film/build.mjs, audio-plan.mjs, phone-plan.mjs and phone-edit.json.
- docs/video/narration.txt, docs/video/x-narration.txt.
- docs/video/out/voice/higgsfield/segments.json.
- docs/video/out/phone-motion-20261104-v5-verification.json and caption-check.json.

Watch/inspect the actual existing cuts and available footage before deciding what is wrong:
- docs/video/out/ShowMe-3min-hackathon-candidate-phone-motion-20261104-v5.mp4.
- docs/video/out/ShowMe-X-launch-candidate-phone-motion-20261104-v5.mp4.
- Original phone: docs/video/incoming/phone-20261104/recipient-original.mov.
- Canonical copy: docs/video/out/raw/recipient.mov.

Do not substitute old emulated cuts or the inactive film/assemble.py and film/review-narration.txt pipeline. Distinguish historical planning statements from current evidence. Inspect the working tree; preserve other sessions' edits and every prior export.

THE PRODUCT TRUTH

ShowMe turns a screenshot plus a goal into one highlighted next step. The browser detects some private details; the user reviews and corrects masking before upload. Muse Spark1.3 identifies the next control. SAM3.1 may refine its outline if the agreement gate passes; it never moves the click point. A second review and consent can create a seven-day guide link. The recipient sees an annotated picture and must act in the original app. Another step requires another screenshot.

Our recorded billing screen is synthetic. The phone footage is the founder's own iPhone16 self-demo, not an independent recipient study. No subscription is cancelled. No testimonial, time-saving result or improved SAM accuracy has been established.

CREATIVE AMBITION

Make it feel like a directed product film with a distinctive visual argument. The emotional journey is confusion → recognition → clarity → trust → invitation. “Thrilling” means anticipation, a precise reveal and satisfying resolution; it does not require explosions, glitches or constant speed.

Avoid another animated README. Do not default to long white slides, three-column feature grids, dense code crops, a long statistic before showing value, or a floating phone beside paragraphs of explanatory copy. Avoid generic AI gradients, neon networks, particles, fake chat messages, endless kinetic text and random3D device spins.

Find the strongest truthful product moment in the supplied footage and use it early. Do not begin with a long logo sting. In the first few seconds, give a cold viewer both a recognizable problem and a visual reason to keep watching. Do not hide the useful thing until the middle.

Develop THREE different directions before choosing one. For each provide:
1. One-sentence premise and why it belongs specifically to ShowMe.
2. The first five seconds, described frame by frame.
3. Signature visual device and how it evolves.
4. Two exact source moments that support it.
5. Its risk: confusion, credibility, visual overload or execution cost.

One direction to explore is “From ‘where?’ to ‘there’”: use a yellow editorial thread to connect the screenshot question, reviewed image, actual guide and original-screen control. It can become a section divider or CTA underline. Keep it OUTSIDE recorded UI. When showing the real product, reveal its actual recorded ring; never animate a fabricated ring over the screen. This is a starting hypothesis, not a mandatory template. Beat it if you find a more specific idea.

Another possible device is a match cut between the same real control in the original, reviewed upload, desktop result and phone recording. Label source/state changes so the edit does not pretend to be one continuous live action. Editorial questions are acceptable; fabricated user conversations are not.

Let the strongest concept determine the transitions. Every transition must connect an idea, scale, shape or action. Reject transitions that merely announce that the editor knows an effect.

TWO FILMS, TWO AUDIENCES

A. Hackathon film: exactly180.000s,1920×1080,30fps,H.264/AAC48kHz, burned captions. Build emotional relevance, demonstrate the real product, make Meta's distinct model contributions understandable, show technical substance and credible evidence, then close cleanly. The rubric in HACKATHON.md is the guide; do not treat internal score claims as judging results.

B. X launch film:44.600s by default, same delivery format. Design it as a standalone social film, not a compressed tour of the submission slides. It must make sense muted and at feed size. The first frame needs a focal point. Establish the problem and useful result early. Let the strongest demonstration dominate; use concise evidence, not the whole benchmark table. Make the ending feel intentional and potentially connect visually back to the opening, without cutting the last spoken word.

An optional alternate aspect ratio or shorter teaser may be proposed after the two required cuts. Do not blindly crop a landscape UI to portrait or silently replace the required delivery.

PACING AND AUDIO AUTHORITY

The approved narration is already generated, paid for and aligned. Preserve every approved word and number and its order. Keep its AI-generated narration disclosure. Do not generate or buy another track.

This brief authorizes redistributing visual scene durations, moving whole narration segments and trimming only verified silence within the fixed180.000s/44.600s totals, if that improves pacing. Preserve natural speech: no acceleration, word truncation, syllable cuts or overlapping narration. Record all timing changes and update caption times from actual retained speech. Save a new edit-specific timing manifest; preserve the old approved manifest and raw audio.

If a better script is essential, save a clearly separate proposal and explain the specific benefit. Finish the best cut compatible with current audio while awaiting approval; do not rewrite or synthesize unapproved words. Do not ask the founder to approve ordinary layout/easing choices.

Audit every long unvoiced interval. Give it a reason: a real action to observe, a reveal, a comparison or enough time to read. Do not fill ten seconds with an almost-static recap merely to reach the duration. Do not turn every pause into visual noise. Existing no-music/no-SFX constraints remain; sound design can be a separate optional proposal, not an automatic addition.

ART DIRECTION AND MOTION CRAFT

Use ShowMe's existing brand as the foundation: ink#16264A, white, mist#E9EEF6, yellow#FFD43B and the approved supporting colours from DESIGN.md. Use the self-hosted Atkinson Hyperlegible Next. Create contrast through composition, scale, rhythm and carefully controlled dark/light changes.

- Establish a deliberate composition and visual hierarchy for every shot.
- Use original footage as the main material, not a tiny inset inside a large slide.
- Mix useful macro details with enough wider context to understand the action.
- Give each frame one dominant focus. If two elements compete, simplify.
- Design motion entrances, settling and exits; do not run identical pop/slide animations everywhere.
- Use directional continuity and match cuts; reserve the strongest transition for the clearest product payoff.
- Settle before the viewer must read a control or metric. Do not zoom, scroll and animate type simultaneously over the same focal region.
- Make key text readable in the actual downscaled X composition. Inspect it at feed size; do not assume1080p readability transfers.
- Keep captions, identifiers and disclosures clear of controls and masks. Reduce repetitive explanatory prose; keep material qualifications readable and honest.
- Disclosures should be integrated cleanly, not hidden, flashed or repeated as a wall of warnings on every frame.
- Render motion deterministically at the output frame rate. Typography and imagery must be loaded before capture.
- Animate fixed metrics into view; do not count through invented intermediate values.

REFERENCE RESEARCH AND SKILLS

Use primary sources and actually inspect the references. Start with:
- YC launch-video discussion: https://www.ycombinator.com/library/fY-this-is-how-you-should-actually-make-launch-videos
- Official Linear product announcements and embedded demos: https://linear.app/changelog
- Official Remotion skills: https://www.remotion.dev/docs/ai/skills
- Frame-driven animation: https://www.remotion.dev/docs/animating-properties
- Timed sequences: https://www.remotion.dev/docs/sequence

Choose two or three specific launch/demo references you can really view. Save their direct URLs and relevant timestamps. For each, identify one principle to adapt and one thing to avoid. Do not pretend you watched an inaccessible video; do not infer performance from style or cherry-picked view counts. Borrow principles, not copyrighted footage, audio, brand identity or shot-for-shot imitation.

Local Remotion guidance exists under /Users/jeeveshsingale/.agents/skills/: remotion-best-practices, remotion-create, remotion-markup, remotion-captions and remotion-render. Read the relevant SKILL.md and its linked references before using them. Verify what the current agent can discover; an installed skill is not proof of a working runtime. /Applications/Open Design.app exists, but its video/export capabilities have not been verified.

Use the smallest reliable local toolchain. The authoritative delivery pipeline remains film/build.mjs. It already uses deterministic Playwright/CSS and FFmpeg. Remotion may author an isolated editorial motion asset feeding that builder if it materially improves the chosen idea. Open and verify Studio preview first if creating a Remotion composition. Do not migrate the entire film just to use a named tool. Do not install redundant tools or run unreviewed GitHub setup scripts. Keep phone footage local; do not upload it to third-party creative services.

SUBAGENTS

Use up to three specialist agents concurrently, with self-contained briefs and disjoint file ownership. You own direction, build.mjs integration, timing manifests and final verification. Follow project agent rules; do not use GSD agents.

1. Story/reference researcher: owns docs/video/redesign/REFERENCES.md and CONCEPTS.md. Researches and challenges the first-five-second hooks, audience comprehension and concept specificity.
2. Motion designer: owns only an explicitly assigned new motion asset/module directory, e.g. docs/video/redesign/motion/. Builds the chosen concept's reusable editorial visuals; does not edit product code, narration or the authoritative builder.
3. Skeptical reviewer: owns docs/video/redesign/REVIEW.md. Reviews actual previews for factual claims, privacy, readability, visual clichés and footage provenance. Does not repair source files concurrently.

Tell all agents they share a codebase and must preserve others' work. Ask for actual findings with timestamps, not flattery or invented ratings. A subagent score is editorial opinion, not evidence of virality, human comprehension or a prize probability. If subagents are unavailable, run these reviews sequentially yourself and state that limit.

PRODUCTION SEQUENCE

1. AUDIT: Write a blunt timestamped critique of v5: what is slow, repetitive, over-explained, visually weak, illegible or disconnected from speech. Separate observed defects from taste. Include what must remain.
2. DIRECTION: Research references and propose three concepts. Choose the strongest with reasons. Save the director's treatment, visual system and source-backed beat sheet before implementation.
3. STORYBOARD: For every shot specify output start/end, source file and in/out, viewer takeaway, composition, motion, caption area, disclosure and transition. Identify genuine action versus editorial graphic versus held frame.
4. PROOF: Render a locally playable8–12s proof containing the hook, signature visual device and real product payoff. Inspect actual frames at full size and feed size. Run the skeptical review and fix concrete weaknesses. Use existing approved audio where available; do not synthesize a temporary fake voice. Continue without waiting for routine design approval.
5. BUILD: Apply that direction consistently to both complete cuts. Track exact video frames and speech timing. Render to new candidate filenames; preserve v5 and every previous export.
6. REVIEW: Inspect openings, reveals, transitions, captions, metrics and final frames. Check the final videos themselves, not only HTML previews. Independently review again after integrating captions and sound.
7. VERIFY AND DELIVER: Complete decoding, dimensions/codecs, exact durations, per-scene frame budgets, transcript/caption synchronization, source hashes, privacy masks, phone label readability and claim checks. Correct total duration alone is insufficient. The existing source ends before a desktop end marker; never repeat that drift bug. Do not reuse caches solely because files exist.

Save progress and decisions after each stage in docs/video/redesign/HANDOFF.md so another agent can resume without reconstructing the chat. Include completed files, commands, remaining work and failed experiments. Preserve alternatives rather than deleting them.

NON-NEGOTIABLE EVIDENCE AND PRIVACY

- No new Meta calls, paid generation or spending the reserved credits. Previous net Higgsfield spend6; last checked balance4. Recheck only if necessary; never print credentials.
- No fake UI, regenerated product footage, simulated successful taps, fake people, testimonials or cancellation confirmations.
- Do not alter the recorded product ring or repair an incorrect result graphically.
- Do not expose the phone keyboard, app switcher, private library, notifications, account details or secrets. Consult phone-edit.json: exclude source0–6.2s and24.2–26.2s. Review new boundaries carefully.
- The original phone source is SHA2563cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068. Device is user-reported iPhone16; phone take count/iOS unknown. Self-demo remains explicit.
- Held frames, skipped waits, take selection and navigation cuts need truthful labels. A crop from a different timestamp must not pretend to be simultaneous live action.
- Current evidence:1054/1172=89.9%; Pro186/300=62.0%; absent151/200=75.5%, with44 of the remaining49 still highlighted; live-web12/20 development tasks. Injection10/10 is separate. Retain material overlap and SAM-off qualifications. Verify original artifacts in eval/results; never edit generated results or invent improvement.
- “2.8seconds” and “under a cent” describe measured grounding, not the entire user workflow.
- No deployment, publishing, posting, organizer declarations or submission on my behalf. Produce reviewable local files. Full founder playback/privacy approval and actual hosting/portal confirmation remain human gates.

ACCEPTANCE STANDARD

Do not declare success because the code renders or because you award yourself9.5/10. Demonstrate the change:
- A cold viewer can infer the problem and useful result from the opening; an actual human check is reported only if performed.
- The first product payoff is deliberately early and drawn from real footage.
- The visual motif is specific to ShowMe and carries the story rather than decorating it.
- The X cut is coherent muted and readable at feed size.
- Every long hold earns its time; motion does not compete with comprehension.
- The actual button, captions, evidence and disclosure remain legible.
- No new unsupported factual claim or deceptive editing failure.
- Both required media files pass technical checks and materially differ from the6.5/10 cut in direction, hierarchy and pacing.

FINAL HANDOFF

Return both playable local candidates, a storyboard/contact sheet, source/timing/provenance records, verification results and a concise before/after rationale with timestamps. Include two optional X-post drafts and a thumbnail/poster selected from our own film, without publishing. Explain any unresolved human or project gates precisely. Give me an actual film I can evaluate, not only a proposal or a list of tools.

Start by inspecting the existing videos and saving the timestamped audit and three creative directions. Then execute the strongest direction through a proof, complete renders and verification. Work autonomously on reversible local decisions; ask only when a concrete change requires new authorization, such as altered approved words, paid spend or publishing.
