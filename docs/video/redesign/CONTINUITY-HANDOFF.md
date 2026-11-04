# Continuity candidates — 4 November 2026

Later founder preference change: [the readable finish](READABLE-DELIVERY.md) keeps editorial text visible and uses light emphasis. These continuity v2 exports remain preserved as the liked prior version.


The founder authorized the timestamped review fixes and requested an 8.5/10 pass. Both full candidate films are exported. These are not yet founder-approved or submitted.

## Watch these candidates

- [180.000-second hackathon film](../out/ShowMe-3min-hackathon-candidate-ink-continuity-20261104-v2.mp4)
- [44.600-second X film](../out/ShowMe-X-launch-candidate-ink-continuity-20261104-v2.mp4)
- [Poster](../out/ShowMe-poster-ink-continuity-20261104-v2.jpg)
- [Film contact sheet](../out/ink-continuity-20261104-v2-review/film-contact.jpg)
- [X contact sheet](../out/ink-continuity-20261104-v2-review/x-contact.jpg)

## Applied changes

1. Removed the floating, unspoken “There.” from both openings. Replaced vague “Their goal: cancel this” with a precise goal.
2. The opening result holds the real highlight and instruction together in one stationary source composition. Removed the second opening reframing and premature phone pinch. Small ShowMe identity establishes the product early.
3. The study sequence has one sourced figure, without simultaneous phone motion and a second grid. Its population/sample remain explicit and its exact meaning is retained in approved captions/narration.
4. “Name still readable” and “Still readable: 3 fields” became neutral manual-review labels, preventing contradictions after the actual brush lands.
5. Engineering shows genuine adjacent source lines with token emphasis, rather than obscuring the context with editorial black bars.
6. Grounding figures use approximately 2.8 seconds and less than one cent; the grounding-only/median/mean qualifications remain.
7. Independent QA found the X phone disclosure covering the lower edge of the recorded ring at about29s in continuity v1. v2 changes only that X crop's static vertical origin, retaining original source speed, target pixels and disclosure. Sampled projected clearance is71.8px; the old geometry overlapped by8.2px. The final decoded shot was independently inspected.

All ink v3 source and exports remain intact. Continuity v1 remains available but use v2 for review. The v2 film is byte-identical to the independently reviewed v1 film; only X needed the final clearance change.

## Bounded visual/editorial assessment

An independent reviewer inspected actual decoded exports, native critical frames, a2fps opening sequence and15fps transition sequences. It did not hear the soundtrack or perform continuous real-time playback. The scores below are subjective editorial judgments, not Meta judging results, audience testing or a prediction of selection.

| Criterion | Film /2 | X /2 |
| --- | ---: | ---: |
| Opening clarity | 1.8 | 1.8 |
| Demonstrated product value | 1.8 | 1.7 |
| Continuity and hierarchy | 1.7 | 1.6 |
| Readability | 1.5 | 1.6 |
| Truthful evidence/disclosures | 1.8 | 1.8 |
| Total | **8.6/10** | **8.5/10** |

The initial X score was8.3 because of the specific overlap. Its readability score increased after inspection of the actual fix. Other dimensions were unchanged. Remaining weaknesses are small recorded UI details, dense X evidence and unassessed real-time feel of the chapter wipes. No score was raised merely to meet the requested threshold.

## Verification

- [Final media report](../out/ink-continuity-20261104-v2-verification.json): no failures.5400/1338frames;1920×1080,30fps,H.264/AAC48kHz; full decoding clean.
- All13 approved voice segments retained, with measured lag at most0.5ms. Exact approved transcript and measured SRT cues; burned-caption start error at most1frame. AI-generated narration remains explicit.
- Metrics recounted from generated evaluation artifacts at module load and independently checked. Original phone hash and reviewed source-window checks pass. Guide-token OCR checks pass; source masks remain intact.
- All124 ShowMe outputs present before v2, including previous videos, posters, captions and provenance, remain hash-identical. The pre-task117outputs/41MP4s are preserved transitively. Audit receipts are in `out/ink-continuity-*-before.json`.
-40 audio/phone/continuity tests pass, including4 regressions observed failing before fixes. Rendering checks text fit on every captured frame. `make lint test` passes169backend/33eval/99web plus scripts; one existing backend warning. No app code changed after that run.
- New Higgsfield generation0, new Meta calls0. No deployment, upload, posting, submission, commit or push.

## Source and resume

Plan: `CONTINUITY-PLAN.md`. Isolated source: `continuity/film.mjs`. Shared integration: `film/build.mjs` and `redesign/motion/render.mjs`; all previous edit modes retained. Current approved scripts, WAV files, `timing.json` and `segments-fixed-point.json` are unchanged.

From the repository root, use a fresh tag to render:

```sh
node --test docs/video/redesign/continuity/*.test.mjs docs/video/film/audio-plan.test.mjs docs/video/film/phone-plan.test.mjs
TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=continuity CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs all
```

Before a further render, create a `<new-tag>-before.json` map of prior ShowMe output paths to hashes under `docs/video/out/`, following the existing audit receipts. Verify with:

```sh
uv run -q --with numpy --with scipy --with pillow python -I docs/video/redesign/continuity/verify.py <new-tag>
```

## Human and release gates still open

Watch both complete films with sound, then muted on the physical phone. Confirm speech, silence, transitions, privacy and target readability. The footage remains an iPhone16 self-demo of a synthetic example, not an independent recipient study or a completed cancellation. The iOS version and phone take count remain unknown. Product/deployment parity and other release checks are separate from this video edit. Host only the selected candidate, verify signed-out playback and complete the actual submission separately. This task authorized no external publishing or paid calls.
