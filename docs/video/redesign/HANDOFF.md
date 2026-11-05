# Redesign handoff

**Current direction: `INK-HANDOFF.md`, tag `ink-20261104-v3`.** Everything below is a rejected or earlier direction, kept for reference.

## New founder-feedback candidate: `story-20261104-v1` (X only)

Founder said the locked cut was “Too static or boring; weak story and payoff.” A complete alternate 44.600s X candidate now exists at `out/ShowMe-X-launch-candidate-story-20261104-v1.mp4`, plus `out/ShowMe-story-opening-proof-20261104-v1.mp4` (15.800s). Neither is founder-approved. The 180-second film remains the preserved v8 below; no story film was exported.

- Plan and diagnosis: `RESCUE-PLAN.md`. Implementation: `rescue/film.mjs`; authoritative entry `FILM_EDIT=story` in `film/build.mjs`. Other modes preserved. Story intentionally rejects `film` and `all` until a complete film direction is implemented.
- Fourteen idea-led shots, stationary evidence inside each shot, contrasting paper/ink compositions, larger real highlighted-control crops, original-speed brush action, 3.37s of phone motion with a separately labelled held detail, one evidence result per plate. Original six X paragraphs and Callum audio retained. No music or SFX.
- Verification: `out/story-20261104-v1-verification.json`; 1338 frames, 1080p30 H.264/AAC48kHz, decode clean; 15 caption cues match approved text, SRT error <0.5ms, rendered caption boundaries within one frame. Soundtrack vs v8 correlation1.0 at0ms. All31 prior MP4 hashes preserved. Generated metrics independently recounted. Every referenced phone frame passes reviewed-window/self-demo checks. Sampled exported stills inspected; full human playback remains open.
- `make lint test`: pass (169 backend,33 eval,99 web plus scripts; one existing backend warning).32 audio/phone/story tests pass. Source and transcript untouched.0 paid generation,0 Meta calls, no publish/deploy/commit/submission.
- Resume render, NEW tag only: `TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=story CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs x`.
- Next: founder watches actual motion, especially payoff0:03.89 and phone0:26.07. If this direction feels stronger, apply it to the180s film as specified in RESCUE-PLAN.md. Do not use AI still scores to certify audience response. Product styling changes are not needed to assess this edit.

---

## Current: "Locked", tag `locked-20261104-v8`

The founder rejected the moving `fixed-point` cuts as unstable, with unnecessary zoom and poor cuts, and asked for perfect positioning, no needless zoom or cuts, real, elegant and unique, with an LLM judge per section. This section supersedes everything below for the current film.

- **Candidates:** `out/ShowMe-3min-hackathon-candidate-locked-20261104-v8.mp4` (sha256 starts dc99682436ad896d), `out/ShowMe-X-launch-candidate-locked-20261104-v8.mp4` (80d57b5d8b97a601)
- **System:** one fixed sheet, mist background. No camera, zoom or pan. Screenshots at exactly 1:1 in one rectangle, states dissolving in place, so the button never moves. The only accent is a highlighter stroke behind a phrase, and a highlighter mark in the margin beside the phone.
- **Code:** `redesign/locked/film.mjs` (`FILM_EDIT=locked`), shared `motion/render.mjs`, `film/build.mjs`, `verify.py`, `judge-pack.py`, `judging/RUBRIC.md`, `STORYBOARD-LOCKED.md`, `contact/locked-*`.
- **Verified on v8:** `out/locked-20261104-v8-verification.json`, no failures. 5400 and 1338 frames, full decode clean, approved speech within 0.5 ms of plan. Earlier exports unchanged. Token not OCR-readable in 10 link-shot samples.
- **Motion:** instant whole-picture changes in the 180 s film: Codex v5 19, fixed-point v3 31, locked v8 1 (the recorded link appearing at 1:22.5). Mean frame change 0.517, 0.674, 0.194.
- **Judge scores are editorial opinion from stills, by Sonnet subagents.** They did not see motion or hear audio. Latest full round was on v7; v8 differs only by fixing a text-reflow defect and slightly larger labels, and was not re-scored. Film sections v7: 7.4, 7.9, 8.0, 7.5, 7.0, 7.8, 7.6 (mean 7.6). X sections v7: 7.0, 7.3, 7.0, 7.7, 8.0, 7.6 (mean 7.43). **No section reached the requested 8.5.** Round-to-round noise is about 0.5. Results in `judging/`.
- **Blind A/B from stills, v7 against Codex v5:** v7 7.8, v5 5.5.
- **Known limits:** the white cut-out and dim scrim around the ring are how the product renders; judges mark them down and the edit may not repaint them. Improving that needs a product change and a re-record, which needs founder approval because it means new Meta calls. The narrow phone text and the code section are the weakest remaining parts.
- **Traps:** the rate limit stopped 13 parallel judges at 10:10 London; two batched judges avoid it. The `run_in_background` render exit codes are reliable; `| tail` in the foreground hides them.

Run: `TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=locked CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs all`, then `verify.py <new-tag>` and `judge-pack.py <new-tag>`.

---

## Earlier: "The point that doesn't move"

Brief: `docs/video/OPUS-CREATIVE-DIRECTOR-PROMPT.md`. Direction: "The point that doesn't move" (`CONCEPTS.md`, `TREATMENT.md`).

## Status

- [x] Audit: `AUDIT.md`
- [x] Three directions and choice: `CONCEPTS.md`; researcher challenge appended
- [x] References: `REFERENCES.md`. Limit: tools returned page text only, so no reference video was watched
- [x] Treatment and storyboard: `TREATMENT.md`, `STORYBOARD.md` (generated from the renderer's own shot lists)
- [x] Proof: `out/ShowMe-proof-fixed-point-20261104-p1.mp4`, reviewed in `REVIEW.md`, findings applied
- [x] Complete cuts: v1 and v2 kept as superseded, **v3 current**
- [x] Automated verification of v3: `out/fixed-point-20261104-v3-verification.json`, no failures
- [x] Independent review of final media: performed on v2 (`REVIEW.md`). The v3 fixes were checked by the main agent and by `verify.py`, not by a further independent reviewer
- [ ] Human playback, hosting, portal, submission: founder only

## Files

- **Candidates:** `out/ShowMe-3min-hackathon-candidate-fixed-point-20261104-v3.mp4` (sha256 starts b65dba05a7b41268), `out/ShowMe-X-launch-candidate-fixed-point-20261104-v3.mp4` (f2d620a645c9e2bb), each with `.srt` and `.provenance.json`
- Poster: `out/ShowMe-poster-fixed-point-20261104-v3.jpg` (film 0:04.6, "Where do I press? There.", own footage)
- Contact sheets: `redesign/contact/` (from v3)
- Timing: `redesign/timing.json`, `redesign/cue-breaks.txt`, `out/voice/higgsfield/segments-fixed-point.json`. Approved `segments.json` and WAVs untouched
- Renderer: `redesign/motion/` (`film.mjs` shots, `render.mjs`, `track.py` button measurements, `storyboard.mjs`, `film.test.mjs`); checks in `redesign/verify.py`
- Integration: `film/build.mjs` gained a small `FILM_EDIT=fixed-point` switch; v5 behaviour is unchanged without it
- X drafts: `redesign/X-POST-DRAFTS.md`. Nothing posted

## Before and after

| Moment | v5 | v3 |
| --- | --- | --- |
| First payoff | 0:14.8, wide shot | 0:04.2, full-width real ring on the same spot as the button in frame 0 |
| 0:04 to 0:15 | Static 65% card | Real pinch release, then 65% beside the real guide |
| Redaction reveal | 0:36, two small images and three boxes | 0:39, full-frame wipe from original into the actual upload, 4.25 s, no voice |
| "The click point never moves" | 13 s static frame with a panel | 1:13, five labelled states with the button locked in place, resolving on x 482, y 632 |
| Phone | 1:26, 414 px beside copy | 1:25 to 1:43, near full frame; the product's own notice and next-step text fill the frame |
| Handoff | Side crop | 1:34.8, the pinched ring cuts to the real original at nearly the same place and size, labelled as a navigation cut |
| Code | 17 s of small crops | 1:47 to 2:03, one real line per spoken idea, plus the benchmark's limit |
| Not visible | 4 s pill | 2:03, 4 s of silence with a new goal, then the real page with no ring |
| Evidence | Table held 28 s | 2:11 to 2:39, one figure per spoken claim in one place, then the full table for 5.4 s |
| Ending | Unrelated end card | The opening composition with ShowMe where the question was |
| X cut | Tour of film cards, four-row table | Standalone: same hook, plates for muted viewing, figures readable at 480 px wide |

## Unvoiced time, film

Tails after speech: 1.33, 4.31, 2.59, 2.92, 2.17, 5.63, 5.06 s, plus the 4.0 s lead-in before film-5. Reasons: real reveal (privacy wipe), read (coordinates, unpressed original, code limit, full table, URLs), anticipation (new goal). No music or SFX added. Whether this silence feels right needs a human listen; a sound-design pass would be a separate proposal.

## Decisions on the final review

Accepted: guide token masked, X failure figures relabelled, hook label corrected, "synthetic" and "nothing cancelled" added to X labels, stat no longer overlaps the phone, "Frame held" gated to truly held frames, X gate value labelled, muted plates added. Study figures kept: approved narration, sourced in `docs/SUBMISSION.md` section on the 65% statistic and recorded in `docs/MEMORY.md`. Not changed: marks gliding in the opening (see `TREATMENT.md`).

## Open

- Founder must watch both with headphones and muted on a phone.
- v5, v1 and v2 still show the live guide token until the guide's 9 November expiry. Use v3.
- The synthetic screen shows card-like dummy data under a "made up" label, as agreed in earlier provenance; confirm comfort.
- `SUBMISSION-VIDEO-READY-2026-11-04.md` still describes v5. Update it only if the founder chooses v3.

## Commands (repo root)

```bash
python3 -I docs/video/redesign/recue.py
uv run -q --with numpy --with scipy --with pillow python -I docs/video/redesign/motion/track.py --extract
node --test docs/video/redesign/motion/film.test.mjs docs/video/film/audio-plan.test.mjs docs/video/film/phone-plan.test.mjs
TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=fixed-point CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs all
uv run -q --with numpy --with scipy --with pillow python -I docs/video/redesign/verify.py <new-tag>
```

Always use a new tag; the builder refuses collisions. Do not pipe the render through `tail`, which hides its exit code.

## Failed experiments and traps

- First full render stopped on purpose: the source-window guard rejected phone source 24.22s, inside the app-switcher exclusion. Fixed by holding at 24.0s and labelling it.
- A command containing `rm -rf` on a scratch folder was held by a guard with no answer; subsequent work used new folders and deleted nothing.
- X scene durations must be whole frames. 8.05 s gave 241.5 frames and a 1339-frame total; now 8.0333, 11.8333, 3.3334.
- `film-2` correlates 0.79 with its WAV at 8 kHz in both this cut and v5, across every window, with 0 ms lag. It is a measurement property of that file, not an edit defect. Verification now compares each segment against the same speech in v5 (all at least 0.99).
- X segments 3 to 5 first looked corrupted against v5 (0.01 to 0.59). Cause: whole-millisecond `adelay` rounding shifts them under 1 ms, which breaks a zero-lag comparison. At the best small lag they match at 1.0. An automatic memory observation from that moment, numbered 813, wrongly calls it speech corruption; ignore it.
- Remotion not used: not needed for a pure function of time in the existing Playwright and FFmpeg stack.

## Rules that keep this resumable

- Never overwrite v5 or any previous export. New tags only.
- No new Meta calls, paid generation, publish or submit. This work spent 0 credits and made 0 Meta calls.
- Approved segment audio files and `segments.json` are read-only.
