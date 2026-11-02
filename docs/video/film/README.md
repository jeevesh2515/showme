# Film pipeline

`capture.mjs` records the live product. `build.mjs` edits the takes into `docs/video/out/ShowMe-3min-hackathon.mp4` (exactly 180 s) and `ShowMe-X-launch.mp4`. Outputs and raw frames are gitignored.

```bash
MOCK=1 ONLY=main node docs/video/film/capture.mjs       # free rehearsal, footage not used
node docs/video/film/capture.mjs                        # live: step, refine, step. About $0.01; log it in eval/results/spend.json
TAKE=fifth node docs/video/film/build.mjs all           # say which recorded take this is
```

Replace the synthetic voice by adding `docs/video/out/voice/founder/film-0.wav` to `film-6.wav` (one per paragraph of `narration.txt`) and `x-0.wav` to `x-5.wav`, then rebuild. The "synthetic voice" line leaves the end card by itself.

Replace the emulated phone by adding `docs/video/out/raw/recipient.mov`, then rebuild. The on-screen label changes to the actual iPhone. Edit the narration only to say what the recording really shows.

Sharing is limited to 5 guides a day per connection, reset at midnight UTC. A take fails at Create link once that is used up.
