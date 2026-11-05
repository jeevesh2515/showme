# Claude prompt: rebuild both ShowMe films

Copy everything below into Claude with access to this repository. This supersedes the previous creative direction; it preserves factual, privacy, audio and spending constraints.

---

You are directing and editing two ShowMe product films. Work to the standard of a senior technology-launch film director and motion designer. This is a craft role, not a claim of employment or endorsement by Meta. Your deliverable is BOTH complete, playable videos, with source, verification and a resumable handoff.

Work in `/Users/jeeveshsingale/dev/ShowMe`.

## The actual problem

I rejected the previous edits. The moving cut had distracting zooms and unstable framing. The locked v8 became a static presentation. The subsequent story X cut still looked bad to me: oversized headlines beside enlarged screenshots did not create the film I wanted. Treat all these as rejected creative references, not approved templates. Do not make another variation of their layouts.

I want an attractive, confident, memorable product demonstration: a recognizable problem, an early real payoff, a satisfying explanation and an ending that makes the viewer want to try it. Energy should come from action, contrast, anticipation, timing and resolution. Decorative motion and huge type alone are insufficient. Do not promise a prize, hiring outcome or virality.

Take responsibility for editorial choices. Do not ask me to become the art director by picking every font, transition or crop. Ask only when a decision requires new authority, such as altered narration, spending, new recordings or publishing.

## Start with the media and facts

Read AGENTS.md and the applicable project rules, then:

- `docs/video/film/build.mjs`, `audio-plan.mjs`, `phone-plan.mjs`, `phone-edit.json`.
- `docs/video/narration.txt`: seven approved film paragraphs.
- `docs/video/x-narration.txt`: six approved X paragraphs.
- `docs/video/out/voice/higgsfield/segments.json` and `segments-fixed-point.json`.
- `docs/video/redesign/HANDOFF.md`, `RESCUE-PLAN.md` and `docs/video/take-audit.md`.
- `docs/DESIGN.md`, `docs/HACKATHON.md`, `docs/video/assets/evidence.json` and the generated evaluation artifacts it identifies.

Inspect the actual media, including the original phone recording and selected desktop source:

- `docs/video/out/ShowMe-3min-hackathon-candidate-phone-motion-20261104-v5.mp4`.
- Both `locked-20261104-v8` candidates in `docs/video/out/`.
- `docs/video/out/ShowMe-X-launch-candidate-story-20261104-v1.mp4`.
- `docs/video/out/raw/recipient.mov`.

Use playback when available; inspect consecutive decoded frames when needed. State accurately what you viewed and heard. A contact sheet is not a motion or audio review. Diagnose three specific failures with timestamps before editing. Keep this diagnosis brief and use it to make decisions.

The `story` mode currently implements X only and blocks film/all. Do not mistake it for a complete two-film pipeline. Keep `docs/video/film/build.mjs` as the authoritative export entry; do not use `film/assemble.py` or `film/review-narration.txt`.

## Choose a film language, not a slide template

Propose one strong direction and explain it in a short paragraph. Describe the viewer's journey and the specific recorded action that provides its payoff. You may challenge any previous aesthetic choice. Keep ShowMe's ink, paper, highlighter and accessible self-hosted type as useful brand anchors, without forcing the website's layout onto every shot.

Use different compositions where the story needs them. A full-screen action, an explanatory graphic, a phone-led handoff and an evidence sequence have different jobs. Design them accordingly. Avoid repeating a large slogan on the left and a cropped screenshot on the right throughout the film. Avoid giving every section the same title-card entrance.

The product should be the visual protagonist. Prefer showing the actual action over restating the narration as a headline. Do not make viewers simultaneously read narration, a second marketing sentence, dense UI and a block of provenance. Keep captions in a consistent safe area. Place concise, necessary disclosures at the relevant shot and keep the detailed source ledger in accompanying files. Never hide a material limitation to make a shot cleaner.

Screens must be steady while someone is reading them. This does not require a single layout or zero cuts. Use motivated edits, legible static details and restrained transitions. If a move helps comprehension, keep the focal point stable and the complete relevant control visible. No continual zooming, drifting, bouncing or needless device spins. Do not force a cut cadence or a target motion score.

Build one distinctive motion idea out of ShowMe's purpose: turning an ambiguous screenshot into a shared, understandable next step. Explain what it communicates and where it resolves. Keep editorial graphics visibly separate from the recorded product. Never draw a prettier replacement ring or animate a fake successful interaction.

## Two separate editorial jobs

### Hackathon film: exactly 180.000 seconds

Judges must understand the problem, observe a genuine demonstration and see why this is an engineered system using Meta models.

Show a real useful result in the opening, even while the approved voice establishes context. The statistic must not postpone the demonstration. Then build a causal sequence: review the screenshot locally; catch what automatic detection missed; upload only after review; identify a control with Spark; accept a SAM outline only through the agreement gate; create a consented seven-day handoff; show the actual iPhone guide.

Engineering should answer “why should I trust this?” through short, readable, genuine code or test excerpts matched to the spoken claim. Do not hold an entire source-code sheet while a highlighted phrase crawls through it. Evaluation should distinguish what works, what fails and the test scope. Give each spoken figure a clear reading moment, then use a concise summary if useful. Avoid a benchmark table occupying half a minute with only changing emphasis.

Close by resolving the opening problem and giving readable app/repository destinations. Do not spend the final seconds on a decorative logo animation that obscures the invitation.

### X film: exactly 44.600 seconds

This is a standalone film for a cold viewer who may be muted. It needs to show what ShowMe does quickly, then earn trust through the privacy action, the real model result and the phone handoff. Prioritize recognizable action and readable controls. Use the approved spoken evidence with its necessary qualifications; do not import every technical detail from the long film.

Make the first frame intelligible without sound. Make the useful result clear within the opening few seconds. Give the ending a deliberate connection to the promise at the beginning. It should feel like a compact demonstration, not six miniature slides from a presentation.

## Audio, timing and honest footage

Preserve all approved words, numbers and their order in each film. Use the existing Callum tracks. Do not generate more speech, clone a voice or label AI speech as founder narration. You may redistribute verified silence and scene holds within the fixed total runtimes, using measured speech and word timings. Never truncate words, overlap spoken sections, silently accelerate speech or proportion captions by paragraph length.

No music, sound effects, avatars, synthetic B-roll, replacement product footage, restyling or upscaling. If the existing narration limits the edit, identify the exact issue and propose a separately approved change; continue producing the authorized version meanwhile. Do not quietly rewrite or substitute audio.

The billing screen is synthetic. The phone is my own iPhone 16 self-demo, not an independent recipient or usability study. A guide is an annotated picture, not remote control. No subscription was cancelled. Another step requires another screenshot.

The phone source SHA256 is `3cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068`. Respect `phone-edit.json`; exclude source 0–6.2s and 24.2–26.2s. Do not show private library navigation, keyboard/app switcher, notifications or live guide tokens. Clearly label separate-time held detail crops, held frames and navigation cuts. Use the take audit for the desktop ordinal; the phone take count and iOS version are unknown.

Do not beautify the product's white highlight cut-out or scrim in post. Do not change the app or re-record it under this prompt. Tell a stronger story with the evidence already available.

## Evidence and constraints

Revalidate every displayed number against generated artifacts. Current recorded figures include 1054/1172 =89.9% grounding, 186/300 =62.0% Pro, 151/200 absent-target “not visible”, 44 of the other49 still highlighted, and12/20 live-web development tasks. Injection10/10 is separate. Preserve repeated-image, overlap and SAM-off qualifications where applicable. Grounding latency/cost is not full-workflow latency/cost. No claim that SAM improves accuracy or that a self-demo proves usefulness.

No new paid generation, Higgsfield spending or Meta calls. No deployment, upload, social posting, submission, commit or push. Never print credentials. Preserve raw sources, approved audio, alternative work and every previous export; use fresh candidate names.

## Tools and collaboration

Inspect installed skills before choosing tools. Use relevant Remotion creation, markup, caption and rendering skills if Remotion actually helps. Existing Chromium/CSS/FFmpeg remains a valid choice. Do not migrate frameworks just to use a fashionable tool. Prefer an isolated new edit module and small integration changes; avoid breaking working modes or adding redundant dependencies.

If reference research helps, inspect two or three first-party product films or authoritative editing references. Record exactly what you could view and one technique you will adapt. Do not claim to have watched a film based on a title, summary or transcript alone. Do not install unknown GitHub code or execute downloaded scripts. Research should sharpen the edit, not become the deliverable.

You may use up to two useful subagents: one for source/reference auditing, one for independent final-media QA. Give disjoint ownership; keep direction and integration with the main agent. Do not run a panel of LLM judges or optimize for an8.5/10 score.

## Production sequence and definition of done

1. Save a concise direction, timestamped storyboard, source map and implementation commands in a new handoff file before substantial editing.
2. Render an8–12second representative moving proof with existing audio, then assess actual motion, readability and timing. Fix obvious problems. Show it to me when possible and incorporate any response; unless I ask you to pause, continue building both complete videos. A proof alone is not task completion.
3. Render both required candidates through build.mjs with fresh filenames:1920×1080,30fps,H.264/AAC48kHz, burned captions, exactly5400/1338frames and180.000/44.600seconds.
4. Check full decoding, actual soundtrack timing, caption words and rendered boundaries, every source window, privacy masks, control readability and displayed evidence. Review motion as well as stills. Report the limits of your inspection honestly. Run affected tests and required repository checks.
5. Reconcile hashes to demonstrate preservation of earlier exports. Save the editable source, timing data, provenance, verification and resume instructions.

Deliver BOTH playable candidate links, a poster/contact sheet, a concise before/after explanation with timestamps, tests and remaining human gates. Use “candidate” until I approve actual playback. Do not ask me to fix the product as a prerequisite for an editorial improvement. Do not declare victory from rendering successfully or from AI scores. Make a coherent film that I can judge with my own eyes.
