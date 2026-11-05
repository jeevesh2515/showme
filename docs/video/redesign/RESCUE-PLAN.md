# ShowMe editorial rescue — 4 November 2026

Refs: WEB-1, ENG-4, EVAL-7. Founder feedback: “Too static or boring; weak story and payoff.”

## Decision

The next version needs a different rhythm and hierarchy, not another numerical LLM score. The locked v8 storyboard gives the same code sheet 19.5 seconds, and its evidence table about 34 seconds. The phone appears to move for only 0.7 seconds before being held. These are source/storyboard observations, not a full human playback review.

The earlier director prompt was over-specified: a signature motif, three concepts, many review passes, fixed approved narration and a numerical quality target competed with the basic requirement to make a satisfying demonstration. The project folders are complicated, but changing tools will not solve the editorial problem. Keep the existing local Chromium/FFmpeg stack and authoritative build.mjs.

## Concrete next output

Make a complete 44.6-second X candidate, plus a 15.8-second opening excerpt, under a new `story` edit. All six original audio paragraphs, measured captions and words remain unchanged. No music, paid calls, UI repainting, synthetic footage or product changes. Preserve every previous export. The 180-second film remains v8 until the founder can assess this new direction in motion; this is an intentional visual-direction checkpoint, not a submission-ready replacement for both films.

## Direction: the answer, then the reason to trust it

Use ink, paper and highlighter from DESIGN.md. Change composition when the idea changes; keep each recorded screen stationary within its shot. Use readable static details rather than animated camera moves. Cut on ideas; reserve short fades for text entrances. A calm product can have a lively edit.

| X time | Visual argument | Recorded evidence |
| --- | --- | --- |
| 0–3.89 | One large, plain question: Where do I press? The original screen makes the problem concrete. | Synthetic original, explicitly labelled |
| 3.89–7.4 | Answer with the actual recorded highlight, large enough to read. Name ShowMe now. | Actual desktop result, held and labelled |
| 7.4–10.82 | The browser masks some details. Real frame dominates; one headline. | Actual review frame |
| 10.82–14.36 | Show the real brush action at its original speed. Make the missed name the focal point. | Selected recorded source interval |
| 14.36–15.8 | The exact uploaded image replaces the review. | Captured redacted upload |
| 15.8–23.83 | Goal → real Spark result → real SAM result, with a plainly scoped agreement condition. | Actual model/result frames |
| 23.83–29.43 | Seven-day handoff, then a phone-led composition with a separately labelled readable detail. | Token-masked share frame; iPhone 16 self-demo |
| 29.43–41.27 | Actual absent-target case; then one evaluation at a time, with failure information retained prominently. | Recorded absent result; existing generated evidence |
| 41.27–44.6 | Large ShowMe identity and readable app/repository URLs. | Editorial end card; AI narration disclosure |

Source changes, held frames and detail crops remain explicit. No pretend chat messages, simulated clicks or cancellation outcome. This is an illustrative synthetic billing example, not a completed cancellation or an independent recipient test.

## Carry this rhythm into 180 seconds after visual review

Retain all approved narration. Opening: product payoff before the study statistic. Privacy: actual masking → actual missed field and brush → uploaded pixels. Models: actual action first, compact response explanation second, real gate last. Phone: give the phone the main frame and a labelled static instruction detail. Engineering: one genuine source excerpt per spoken claim, not five excerpts on one sheet. Evidence: introduce each result with its own readable plate, retain bad outcomes at the same size, then a brief full summary. Close: return to the useful result and a clean invitation.

Do not pursue an arbitrary maximum number of cuts or minimum motion score. Do not use still-frame AI scores as acceptance. Ask the founder whether the payoff is clear, the rhythm feels better and the screen remains readable in actual playback, including muted at feed size.

## Verification and handoff

Use new filenames. Check exact 1338 frames / 44.600 seconds, 1080p30 H.264/AAC, full decode, original transcript and cue timing, soundtrack against the earlier approved mix, every phone source interval, privacy/token masks, and old-file hashes. These checks do not replace human viewing. No deployment, upload, posting, submission or paid generation.

Implementation: `rescue/film.mjs`; authoritative entry: `FILM_EDIT=story` in `film/build.mjs`; shared frame renderer: `motion/render.mjs`. Run commands and actual results will be appended here when available.

## Completed proof and verification

- Complete X candidate: `../out/ShowMe-X-launch-candidate-story-20261104-v1.mp4` (44.600s;1338frames).
- Opening excerpt: `../out/ShowMe-story-opening-proof-20261104-v1.mp4` (15.800s).
- Contact sheet: `../out/story-20261104-v1-review/contact.jpg`.
- Verification: `../out/story-20261104-v1-verification.json`. Exact transcript; audio matches v8 at0ms; captions within one frame; all31 earlier MP4 exports hash-identical.14 shots, including3.37seconds of moving phone source. Source-window tests and token mask retained. No full human viewing claimed.
- Tests: `node --test docs/video/redesign/rescue/film.test.mjs docs/video/film/audio-plan.test.mjs docs/video/film/phone-plan.test.mjs` →32passed. `make lint test` →pass169backend/33eval/99web plus scripts;1existing backend warning.
- Export via authoritative builder: `TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=story CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs x`.
- New Meta calls0; new paid generation0. Nothing deployed, posted, uploaded or submitted. The180s film has not been redesigned in this pass. Founder visual feedback on this actual candidate is the next checkpoint.
