# Authoritative film pipeline

November 4 current delivery: `CANDIDATE_TAG=ink-continuity-readable-20261104-v1`, selected with `FILM_EDIT=readable`; see [redesign/READABLE-DELIVERY.md](../redesign/READABLE-DELIVERY.md). Editorial text stays visible while light emphasis follows the narration. Actual privacy masks remain intact. Earlier continuity, ink, locked, fixed-point and v5 exports remain preserved.

[Certain] The readable delivery retains the actual user-reported iPhone16 self-demo and approved AI-generated narration. The earlier `phone-motion-20261104-v5` delivery and its [verification](../SUBMISSION-VIDEO-READY-2026-11-04.md) are historical alternatives.

`build.mjs` edits existing captured footage into new 180-second film and 44.6-second X candidates. It must not record replacement product footage, overwrite existing exports or delete alternative work.

```bash
node --test docs/video/film/audio-plan.test.mjs
VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments.json node docs/video/film/build.mjs all --check
TAKE='third main recording, selected after earlier attempts' CANDIDATE_TAG=callum-v1 VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments.json node docs/video/film/build.mjs all
```

Run the render only after exact-transcript alignment, all-segment overrun checks and voice approval. The generated candidate names include the tag; a collision fails instead of overwriting. Detailed gates and current spend are in [../HIGGSFIELD-FINISH.md](../HIGGSFIELD-FINISH.md).

Higgsfield audio belongs under `out/voice/higgsfield/`, with an explicit measured-cue manifest and kind `higgsfield`. Every segment contributes to the disclosure **AI-generated narration**. Only genuinely recorded human audio may use kind `founder` and `voice/founder/` with an explicit genuineRecording declaration; a filename is insufficient.

Actual phone footage belongs at `out/raw/recipient.mov`. Its presence now requires `phone-edit.json`, binding source SHA, excluded windows, exact slot durations, explicit holds and self-demo disclosure. `phone-plan.mjs` validates those before rendering. User-reported device details and human observations remain distinct from file metadata. Emulation stays labelled when actual footage is absent. Preserve earlier sources instead of inventing UI or recipient actions.

`--preview` produces local phone/motion shots in a unique workspace without exporting a complete candidate. The complete builder checks exact video frames in every scene before muxing captions/audio. Source endpoints are checked; a fractional-frame conform and explicitly disclosed end hold preserve timing without accelerating action. The saved desktop source ends before its final timeline marker, so its final link frame is held and labelled.

```bash
node --test docs/video/film/audio-plan.test.mjs docs/video/film/phone-plan.test.mjs
```

Do not use `assemble.py` or `review-narration.txt` for these cuts. They remain preserved as alternative work.

Historical verified candidates used tags `callum-20261103-v1` and `phone-motion-20261104-v5`; the current delivery is `ink-continuity-readable-20261104-v1`. Choose a new tag for any subsequent render; never overwrite them. The user-approved film slots are 18.3,28,31.7,34,21,34,13; X is 7.4,8.4,8.2,5.6,11.82,3.18. Both totals remain 180 and 44.6 seconds.
