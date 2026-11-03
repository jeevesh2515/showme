# Authoritative film pipeline

`build.mjs` edits existing captured footage into new 180-second film and44.6-second X candidates. It must not record replacement product footage, overwrite existing exports or delete alternative work.

```bash
node --test docs/video/film/audio-plan.test.mjs
VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments.json node docs/video/film/build.mjs all --check
TAKE='third main recording, selected after earlier attempts' CANDIDATE_TAG=callum-v1 VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments.json node docs/video/film/build.mjs all
```

Run the render only after exact-transcript alignment, all-segment overrun checks and voice approval. The generated candidate names include the tag; a collision fails instead of overwriting. Detailed gates and current spend are in [../HIGGSFIELD-FINISH.md](../HIGGSFIELD-FINISH.md).

Higgsfield audio belongs under `out/voice/higgsfield/`, with an explicit measured-cue manifest and kind `higgsfield`. Every segment contributes to the disclosure **AI-generated narration**. Only genuinely recorded human audio may use kind `founder` and `voice/founder/` with an explicit genuineRecording declaration; a filename is insufficient.

Actual recipient footage belongs at `out/raw/recipient.mov`. Device/consent and action verification remain manual gates even when a file is present. Emulation stays labelled until actual footage replaces it. Preserve its stale copy and unreadable button as known source limitations instead of inventing UI or recipient actions.

Do not use `assemble.py` or `review-narration.txt` for these cuts. They remain preserved as alternative work.
