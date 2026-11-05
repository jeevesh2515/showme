# Director's treatment: "The point that doesn't move"

## The argument

A helper needs one thing from a confusing screen: a point. ShowMe's spoken engineering promise is that "the click point never moves". So the film is built from one rule: **the real button sits on the same pixel of the frame in every shot where a button is on screen.** Original, masked, uploaded, boxed, outlined, phoned, original again. Everything around it changes. The point holds.

Emotional path: confusion (a dense form and a plain question), recognition (the same button, ringed, in under five seconds), clarity (one instruction, one highlight), trust (what left the browser, where it fails, in the same size type as where it works), invitation (the opening frame, answered).

## Visual system

- **Frame:** ink bands around the footage (top 64, sides 40, bottom 152). Footage window 1840 x 864. Labels live in the top band, captions in the bottom band, so neither can cover a control or a mask.
- **Fixed point:** (960, 720). Low in the frame, so the plate above it can carry the words.
- **Marks:** four yellow triangles in the bands, outside the footage, bracketing the point. They arrive at the first cut, hold still through everything, fold away when no button is targeted, and stop short and vanish when the target is absent.
- **Plate above, point below:** the question, Spark's reply, the gate and the closing URLs all use the same composition.
- **Motion law:** the camera only scales about the point. Real pinches and scrolls are stabilised on the recorded ring and labelled. No pop or slide animations. Text rises once and stops. Numbers never count.
- **Colour and type:** ink #16264A, white, mist #E9EEF6, highlighter #FFD43B, Atkinson Hyperlegible Next. No gradients, particles or device spins. Mono only for real JSON and real code.

## Honesty devices

- The top band names every state change, recording boundary and hold. A registered cut could otherwise read as one continuous action, so "Recorded separately", "Navigation cut", "Frame held", "Stabilised on the highlight", and "Separate states, aligned by this edit" are on screen when true.
- The recorded ring is never redrawn. Marks and plates never overlap it.
- Wherever a claim in the voice has an honest qualification, the qualification is at the same visual level: 44 of the other 49 is 54 px type beside the 151/200 number.

## Decisions on outside reviews

- **Researcher, reviewer: marks moving during the opening read as decoration or a glitch.** Partly accepted. Marks made larger, and the motion is one deliberate glide, not hunting. Kept, because arriving at the cut gives the first four seconds anticipation. Human check would settle it; none has been done.
- **Reviewer: 4.23s cut reads as continuous action.** Kept the hard cut, because it is the hook. Added "Recorded separately. Masked first" in the band on that frame.
- **Reviewer: montage leans on the edit's own alignment.** Accepted. Label says "aligned by this edit", and the montage resolves on Spark's actual x 482, y 632.
- **Reviewer: labels unreadable at feed size.** Accepted. Film 32 px, X 40 px, with an automatic render failure if any label overflows.
- **Reviewer: self-demo label missing from the phone payoff.** Accepted. Now on every phone shot.

## Timing changes from v5

Film slots 18.3, 28, 31.7, 34, 21, 34, 13 became 18.3, 25, 34.2, 26, 19.5, 42, 15. Segment film-5 starts 4.0 s into its scene instead of 0.15 s, which creates the silent "New goal" beat. X slots 7.4, 8.4, 8.2, 5.6, 11.82, 3.18 became 7.4, 8.4, 8.0333, 5.6, 11.8333, 3.3334 (222, 252, 241, 168, 355, 100 frames). All words, order and audio files are unchanged; no speech is trimmed, stretched or overlapped. Captions were re-broken at phrase boundaries in `cue-breaks.txt`, with times from the measured word alignment; manifest `out/voice/higgsfield/segments-fixed-point.json`, approved `segments.json` untouched.

## Tooling decision

No Remotion. The frame-driven approach needed is a pure function of time rendered in the existing Playwright Chromium and piped to FFmpeg, which `film/build.mjs` already depends on. `build.mjs` remains the authority for narration validation, audio mix, captions, frame budgets and provenance; `FILM_EDIT=fixed-point` selects this edit.
