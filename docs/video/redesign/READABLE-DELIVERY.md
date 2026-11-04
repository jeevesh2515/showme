# Readable submission exports — 4 November 2026

The founder liked continuity v2 and requested one final preference change: keep letters, words and numbers visible, with lighter emphasis rather than dark covers. This is implemented in both complete exports. Publication and organizer submission have not been performed.

## Upload-ready files

- [Hackathon film,180.000s](/Users/jeeveshsingale/Downloads/ShowMe-Hackathon-180s-20261104-Readable.mp4)
- [X film,44.600s](/Users/jeeveshsingale/Downloads/ShowMe-X-44.6s-20261104-Readable.mp4)

Canonical media remain under `docs/video/out/`, tagged `ink-continuity-readable-20261104-v1`, with SRT and provenance sidecars. Download copies are byte-identical to these exports. `out/readable-delivery.json` records hashes. Previous exports are preserved.

## What changed

- Editorial figures and JSON fields are visible from scene entry. A translucent yellow background follows spoken emphasis; no foreground rectangle covers the glyphs.
- Editorial tabs show their complete text immediately and use pale backgrounds.
- Code token emphasis is lighter. Genuine code context stays readable.
- Dark chapter wipes were removed, so chapter entry/exit no longer obscures words or pictures.
- Product privacy bars, share-token masks, actual product highlighting and source pixels remain intact. This is an editorial preference change, not permission to expose private screenshot information.

Approved wording, scene timing, narration and captions are unchanged. The encoded AAC audio streams match the liked continuity v2 exports bit-for-bit. No paid generation or Meta calls.

## Verification and review scope

- `out/ink-continuity-readable-20261104-v1-verification.json`: no failures.5400/1338frames;180.000/44.600s;1080p30H.264/AAC48kHz; complete decoding clean. All approved speech/text, caption timing, metrics and source-window/token safeguards pass.
- `out/ink-continuity-readable-20261104-v1-caption-boundaries.json`: final start/end fingerprint check for every burned cue. See the generated receipt for actual measured differences.
-42 audio/phone/continuity/readability tests pass. The text-cover regressions failed before implementation and pass afterward. Full `make lint test` passes; current log: `out/readable-project-checks-final.log`.
- Independent reviewer inspected the actual captioned before-emphasis/active states for65%,JSON,latency/cost,gate,grounding/absent counts; every chapter boundary; and X ring clearance. No editorial cover, clipping or new privacy exposure was found in sampled media. Actual source/privacy masks remain visible.
- Review was decoded frames and sequences, not a fresh soundtrack audition or continuous human playback. No new numerical rating is claimed. The user liked the preceding cut, and this change preserves its audio and content; a final full viewing of these files remains the human release check.

## Source and resume

Mode: `FILM_EDIT=readable`. Isolated source: `readable/film.mjs`; original continuity/ink/locked/story alternatives remain. Authoritative entry: `docs/video/film/build.mjs`.

```sh
node --test docs/video/redesign/readable/*.test.mjs docs/video/film/audio-plan.test.mjs docs/video/film/phone-plan.test.mjs
TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 FILM_EDIT=readable CANDIDATE_TAG=<new-tag> VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments-fixed-point.json node docs/video/film/build.mjs all
uv run -q --with numpy --with scipy --with pillow python -I docs/video/redesign/continuity/verify.py <new-tag>
uv run -q --with numpy python -I docs/video/redesign/readable/verify-captions.py <new-tag>
```

Use a fresh tag and create its prior-output hash receipt as in the existing `*-before.json` files before rendering. Keep `ink-continuity` in the tag for this verifier's opening-layout checks. Raw media, voice files and local caches are private/ignored prerequisites, not a fresh-clone public download.

## Release handoff

Follow [the release checklist](../FINAL-RELEASE-CHECKLIST-2026-11-04.md). Local branch `codex/video-readable-highlights` exists; no commit, push or merge was performed in this finish. All older branches are already ancestors of main. A public hosted180s film URL and real X status URL remain required; a Git push does not host ignored video files.
