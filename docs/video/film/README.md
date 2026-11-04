# Authoritative film pipeline

November 4 current candidate: `CANDIDATE_TAG=ink-20261104-v3`, selected with `FILM_EDIT=ink`; see [redesign/INK-HANDOFF.md](../redesign/INK-HANDOFF.md). Earlier candidate: `CANDIDATE_TAG=locked-20261104-v8`, selected with `FILM_EDIT=locked`. Previous `fixed-point` candidates are preserved and superseded. See [redesign/HANDOFF.md](../redesign/HANDOFF.md). Awaiting founder playback; v5 remains preserved.

[Certain] November4: latest exports use `CANDIDATE_TAG=phone-motion-20261104-v5`, actual user-reported iPhone16 self-demo and explanatory motion cards. See [delivery and verification](../SUBMISSION-VIDEO-READY-2026-11-04.md). Existing v1/v2 exports remain unchanged.

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

Historical verified candidates used tag `callum-20261103-v1`; the current delivery is `phone-motion-20261104-v5`. Choose a new tag for any subsequent render; never overwrite them. The user-approved film slots are 18.3,28,31.7,34,21,34,13; X is 7.4,8.4,8.2,5.6,11.82,3.18. Both totals remain 180 and 44.6 seconds.
