# Rebuild handoff: "Black hides. Yellow shows."

## Later continuity revision

The founder subsequently authorized the timestamped opening/continuity fixes. New complete candidates are `ink-continuity-20261104-v2`; see [CONTINUITY-HANDOFF.md](CONTINUITY-HANDOFF.md) for playable links, verification, source and bounded visual scores (film8.6/X8.5). These remain pending founder playback. The ink v3 code and exports documented below are preserved.

---

Status: complete candidates, tag `ink-20261104-v3`. The founder has not approved playback. Edit key `FILM_EDIT=ink`, code `redesign/ink/film.mjs`, tests `redesign/ink/film.test.mjs`.

## Current files

- Film: `out/ShowMe-3min-hackathon-candidate-ink-20261104-v3.mp4` (sha256 starts c58514d33d722967)
- X: `out/ShowMe-X-launch-candidate-ink-20261104-v3.mp4` (85640f1d35e67160)
- Poster: `out/ShowMe-poster-ink-20261104-v3.jpg`. Contact sheets: `redesign/contact/ink-film-contact-sheet.jpg`, `ink-x-contact-sheet.jpg`. Per-shot table: `redesign/STORYBOARD-INK.md`.
- Verification: `out/ink-20261104-v3-verification.json`, no failures. 5400 and 1338 frames, full decode clean, speech lag at most 0.5 ms, burned captions within one frame, token not read by OCR in 10 samples and checked by eye at 2x on both films. Each .provenance.json lists every phone source window.
- Do not use v1: a sliver of the first token glyph shows beside the mask. v2 has the mask fix but repeats caption text. `ShowMe-ink-proof-20261104-p2.mp4` shows the opening before the text change.

## Decisions after review

Independent QA (one Sonnet subagent, decoded frames only) found nine items. Applied: token mask widened; X failure figures shown properly; X disclosure tags raised to 36 px; white reveal bar replaced by yellow; phone original now labelled a synthetic picture in Photos, standing in for their own screen and not sent by ShowMe; X outline cuts on the word SAM; gate values lift earlier; crosshair no longer crosses the Update button.

Not applied, with reasons:
- Film 0:29 to 0:36: brush strokes land 1.5 to 2.5 s after each field is named. This is source speed. The yellow tick marks the field until the stroke arrives, and retiming would misstate the action.
- Sliced field labels in the review: this is how the product draws its text boxes in the recording. Repainting is not allowed.
- Film 1:01.5: the voice says "SAM 3.1" over Spark's box, and the recorded outline lands on the word "outline". Deliberate, the voice says it "tries".

Founder request: on-screen text must not repeat the subtitles. Editorial text now adds information instead: goal, status value, raw hit and miss counts, exact measured cost and latency, dataset names. A test fails if three or more consecutive words match the caption showing at that moment. The recorded product's own notice ("This is a picture of the screen...") and "Stuck on the next screen?" remain, since they are the evidence for the spoken claim; they are product pixels, not edit text.

## Limits

No audio was heard and no real-time playback happened: review used decoded frames, runs of consecutive frames around cuts, and measurements. Whether silence, pacing and wipes feel right needs a human. No reference films were researched, and Remotion was not used because the existing Chromium and FFmpeg stack already renders a pure function of time. Enlarged detail crops use plain browser scaling (up to 1.13x phone, 1.7x desktop), no AI upscaling.

## Next

Founder watches both with sound and muted on a phone. Timestamped reactions go here. Hosting, signed-out test, portal and posting are founder only. `SUBMISSION-VIDEO-READY-2026-11-04.md` still describes v5; update it only if this cut is chosen. 0 paid generation, 0 Meta calls, nothing deployed, posted, submitted or committed.

## Why the earlier cuts failed

Inspected with decoded frames at sampled times and FFmpeg freeze detection. A contact sheet is not a viewing, and no audio was heard by the editor.

1. **v5, 2:18.9 to 2:47.0.** The picture freezes for 28.1 s on the evidence table. Other measured holds: 1:03.8 for 14.2 s, 1:52.0 for 12.0 s. The product appears small beside captions, and a caption sits over the link at 1:25.
2. **Locked v8, 1:43.5 to 2:03.0 and 2:11.3 to 2:45.0.** One code sheet for 19.5 s and one table for about 34 s, with only emphasis changing. The phone moves for 0.7 s then holds until 1:43. Every section shares one sheet layout, so nothing feels like an event.
3. **Story X v1, at 0:00, 0:07.4, 0:10.8, 0:14.4, 0:15.8.** The same big slogan left and enlarged crop right, each with the same underline entrance. The payoff at 0:03.9 reads "ShowMe. There." beside a soft crop, and four text streams compete: headline, sub-headline, caption, provenance.

Common cause: the type carried the film and the footage illustrated it. No cut let the product do something surprising.

## Direction

ShowMe makes two marks. Black hides what is private. Yellow shows the one thing to press. The film uses only those two marks.

The viewer sees a cluttered form and a plain question, and within four seconds everything dims except one button. Then the film earns that moment: black bars land on the screen word by word, automatic detection misses three fields, and the real cursor paints them out at source speed. Spark and SAM follow, and then the real payoff: a thumb on the iPhone pinches the highlight until it fills the frame, and a navigation cut shows the same button on the original with no highlight at all. Numbers and code come out from under black bars when the voice names them, so a failure is revealed with the same weight as a success.

Motion idea: **the redaction bar**. It wipes between chapters, hides each figure and code line until spoken, and lifts away from the URLs at the end. It communicates that showing one thing means choosing what to hide, and it resolves on the invitation.

Editorial marks are flat bars, tabs and margin ticks. They never trace the recorded ring or sit on it. Footage is never repainted.

## Rules for this edit

- Footage fills the frame. Screenshot states share one registration, so the button holds its position across cuts.
- One caption band, ink, always at the bottom. One short tab at most, plus one small disclosure.
- Steady while reading. Hard cuts on spoken ideas. The only camera-like change is a cut-in, and the only zoom is the founder's own recorded pinch.
- Compositions differ by job: full-frame action, phone-led, document (code, JSON), data grid, contained upload on ink, close.
- Evidence grids draw one square per example from `eval/results` in file order, and counts are recomputed at render time and asserted against `evidence.json`.

## Storyboard

Film, 180.000 s. Timing authority unchanged: `timing.json` and `segments-fixed-point.json`. The generated per-shot table is `STORYBOARD-INK.md`.

| Output | Picture | Source |
| --- | --- | --- |
| 0:00 | Form with the goal; the question comes from the voice | billing.png |
| 0:03.8 | Everything dims except the button, same position. "There." | main frame 472 |
| 0:05.6 | Whole real product: ring plus instruction | main frame 472 |
| 0:09.8 | Phone: real scroll and pinch. 65% lifts on the word | phone 14.0 to 22.5 |
| 0:18.3 | Made-up screen, real typing and scan, black bars land per word | billing.png, main 1.0 to 5.1 and 5.2 |
| 0:29.2 | Real brush at source speed, yellow ticks resolve to black | main 7.68 to 15.2 |
| 0:36.7 | Real "Looks private. Continue" | main 16.95 held |
| 0:39.5 | Whole upload on ink, quiet beat | uploaded.jpg |
| 0:43.3 | Goal on upload, then JSON with fields lifted per word | uploaded.jpg, main-step-response.json |
| 0:56.0 | 2.8 s, under 1 cent, scope stated | eval/results |
| 1:01.5 | Real box then real outline | main frames 471, 472 |
| 1:05.4 | Gate diagram from this take's coordinates | main-refine-response.json |
| 1:12.8 | Six states, hard cuts, crosshair stays | registered sources |
| 1:17.5 | Real share: check, consent, link. Token hidden | main 28.0 to 35.4 |
| 1:24.6 | Phone with instruction, then full-frame pinch | phone 9.2 to 12.0, 16.4 to 18.2 |
| 1:30.3 | Phone with its own "not your live screen" notice, large | phone 19.6 on |
| 1:33.6 | Navigation cut: original picture, pinched, no highlight | phone 26.2 to 29.6 |
| 1:38.0 | "Stuck on the next screen?" | phone 12.4 to 14.2, held |
| 1:43.5 | Black document, one real code line per claim | repo source files |
| 2:03.0 | New goal, then real "not visible" | uploaded.jpg, absent-final.png |
| 2:11.3 | One figure at a time with its grid | eval/results |
| 2:39.6 | Four results with limits, 5.4 s | eval/results |
| 2:45.0 | Review, step, original returns, URLs | main, billing.png |

X, 44.600 s: question, "There." by 0:03.5, pinch, bars land, real brush, upload, box, outline with gate value, link, phone, absent result, 151/200 with 44/49, 89.9%, failures, URLs under the original question.

## Source map

- Desktop: `out/raw/main`, third main recording per `take-audit.md`. Waits shortened, disclosed. Registration from `fixed-point-cache/tracks.json`.
- Phone: `out/raw/recipient.mov`, SHA256 `3cf22fd0...1663068`, own iPhone 16 self-demo. Frames via `fixed-point-cache/phone-a` (6.2 to 24.2) and `phone-b` (26.2 to 29.6). Exclusions 0 to 6.2 and 24.2 to 26.2 throw at render time.
- Audio and captions: unchanged Callum tracks through `build.mjs`.
- Figures: `assets/evidence.json` and the `eval/results` folders it names.

## Commands (repo root)

```bash
FILM_EDIT=ink node --test docs/video/redesign/ink/film.test.mjs
TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=ink CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs all
uv run -q --with numpy --with scipy --with pillow python -I docs/video/redesign/verify.py <new-tag>
```

Always use a new tag. Do not pipe a render through `tail`.
