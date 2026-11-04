# ShowMe phone integration and motion edit · 4 November 2026

Status: **implemented and exported as phone-motion-20261104-v5**. Read [the delivery checks](SUBMISSION-VIDEO-READY-2026-11-04.md) first. This plan was saved before implementation; proposals below describe its origin. Source original and previous exports remain preserved. Human playback/privacy approval, hosting and actual submission are still open. References: WEB-1, ENG-4, EVAL-7.

## Editorial decision

[Likely] Make an evidence-led product film: human problem → visible privacy review → real model response → actual phone guide → engineering → results and limitations → simple invitation. Keep the product footage central. Graphics should clarify what the viewer is seeing; they must never repaint a product highlight or imply an action that did not happen. No edit can promise a prize or a view count.

[Certain] Maintain two separate deliverables: the hackathon film at exactly **180.000 seconds** and the launch/X cut at **44.600 seconds**, both 1920×1080, 30fps, H.264/AAC, with burned captions. A new edit replaces the existing phone sequence rather than appending to the three-minute film. Preserve every existing export and all alternative work.

## Authority and authorization

- Authoritative editor: `docs/video/film/build.mjs`.
- Exact approved speech: `docs/video/narration.txt` (seven paragraphs) and `docs/video/x-narration.txt` (six paragraphs).
- Approved audio and actual speech cues: `docs/video/out/voice/higgsfield/segments.json` and its referenced segment WAV files.
- Never substitute `film/assemble.py`, `film/review-narration.txt` or the pasted historical draft. In particular, the historical 76.7%/210 absent-target statement is superseded by 151/200 absent probes, with injection counted separately.
- Local editing, cropping, compositing outside the recorded product UI, motion cards and new candidate exports are authorized. Do not deploy, publish, submit, make a new Meta call, regenerate UI/product footage, restyle the UI, upscale through an AI service, or spend Higgsfield credits.
- Keep the approved Callum narration labelled **AI-generated narration**. The phone clip's silent audio track is not founder narration.
- Previous receipts establish net **6 credits** spent, **4 reserved** (8 gross charges minus a 2-credit refund). This edit needs zero new paid generation; do not claim the receipt balance was freshly queried.

## Preserved input and initial inspection

[Certain] User-supplied source:

`/Users/jeeveshsingale/Downloads/ScreenRecording_11-04-2026 4-11-08 AM_1.mov`

[Certain] Byte-identical local copy, kept outside the automatic builder input until the source windows are selected:

`docs/video/incoming/phone-20261104/recipient-original.mov`

SHA-256: `3cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068`.

- 45,789,971 bytes; duration 30.025034s.
- HEVC, 1180×2556 portrait; variable frame rate, average approximately 51.95fps, nominal 60fps.
- AAC stereo 44.1kHz; decoded volume approximately −91dBFS throughout. Keep it muted; retain raw track in the preserved original.
- `incoming/phone-20261104/ingest.json` retains probe data and the digest. Review-only contact sheets sample at 2fps; native stills are in its `review/` folder. These are not exhaustive privacy clearance.
- Observed sequence: approximately 0–6s keyboard/navigation/loading; 6–24s actual guide with scrolling and pinch zoom; approximately 24.5–26s app switcher; approximately 26–30s Photos displaying the unredacted synthetic StreamFlix example. No subscription change or confirmation is shown.
- The enlarged guide at source16.8s has a legible Cancel subscription label inside the existing highlight. The original at28.7s shows the same synthetic example content. Preserve those pixels; do not draw a new target.
- The original example deliberately contains dummy billing identifiers. Keep **Synthetic billing example** visible so those are not presented as a real person's details. Check the source against the existing fixture before release.
- User confirmed: **“I recorded it on my own iPhone 16.”** Label the edit **iPhone 16 · self-demo**, with device provenance recorded as user-reported. This is not another recipient or an independent usability test. iOS version, coaching/errors and take count remain unspecified. The user supplied their own recording for this edit; no third-party consent is claimed.

## Visual language

[Likely] Use the existing ShowMe identity from docs/DESIGN.md: ink `#16264A`, white, mist `#E9EEF6`, highlighter `#FFD43B`, sun `#FFF4C2`; self-hosted Atkinson Hyperlegible Next. Use large readable type, generous margins and one focal point per frame. Avoid flashing, decorative particles, simulated taps, invented alerts, spinning devices or densely animated statistics.

- Short 0.3–0.6s entrances and gentle pans; settle before the viewer reads a control or metric.
- Graphics live on editorial backgrounds, beside the footage, or between shots. Do not cover, improve or replace the product's own ring, masks, instruction, error or status.
- A magnified inset must come from the exact same recording/time, be labelled **Detail from this recording**, and preserve aspect ratio. A held frame must be disclosed as a held frame; never stretch action or repeat a gesture as though it happened twice.
- Captions follow the existing measured cue times. Move them to the open side of phone compositions; keep every button, model qualifier and disclaimer legible.
- New source has a different portrait aspect ratio from the emulation. Fit it with padding rather than blindly using the old `force_original_aspect_ratio=increase`/top-left crop.

## Hackathon timeline and silence treatment

[Certain] Current approved scene slots are 18.3,28,31.7,34,21,34,13 seconds. The last-spoken times below come from the aligned cue manifest; they describe unvoiced tails, not a claim that every millisecond is digital silence.

| Film time | Main picture and motion | Unvoiced-tail treatment |
| --- | --- | --- |
| 0:00–0:18.3 | Immediate synthetic screenshot/“Where do I press?” hook, then the family-help statistic and product payoff. Keep study attribution. | Last speech16.89s; use the final1.41s for the real guide payoff, not a blank hold. |
| 0:18.3–0:46.3 | Genuine browser masking, manual corrections, and actual uploaded-image comparison. | Last speech38.915s. During38.915–46.3, animate a clearly editorial three-stage explanation: **Detect → Review → Redacted upload**, alongside the actual reviewed upload. No implication that automatic detection catches everything. |
| 0:46.3–1:18 | Existing genuine Spark result, actual JSON and SAM gate. | Last speech77.748s; no filler needed. Keep measured cost/latency scoped to grounding and preserve the trimmed-wait disclosure. |
| 1:18–1:26 | Genuine second review, consent and share-link creation. | Keep actual sharing; no regenerated UI. |
| 1:26–1:38 | Replace emulation with phone guide, then its legible enlarged detail. | Use the proposed source windows below. Captions go beside the phone, not over its instruction/control. |
| 1:38–1:42 | Original synthetic example shown in Photos, matching the guide. | Navigation cut is disclosed. No invented tap, cancellation or recipient-success claim. |
| 1:42–1:52 | The approved narration has just finished (101.004s). Keep the source image/detail and animate an editorial recap: **Review locally → Send a guide → Find the control**. | This replaces the approximately11s stagnant tail with a purposeful visual explanation. Show **Picture only · no subscription changed** and **Next step needs a new screenshot**. Do not add new speech or music. |
| 1:52–2:13 | Existing genuine code crops and browser/API boundary explanation. | Last speech129.25s. Use129.25–133s for a simple boundary diagram, clearly an explanation rather than a live network trace. |
| 2:13–2:47 | Genuine not-visible example, then evidence card with failures and overlap caveats. | Last speech165.44s; hold complete, readable figures. Reveal fixed numbers; avoid count-up animation that displays false intermediate results. |
| 2:47–3:00 | ShowMe, live URL and repo; AI narration and build attribution. | Last speech176.86s; keep3.14s as a useful reading hold. A subtle underline may settle; do not add busy motion over the URLs. |

[Certain] Filling silent gaps does not require filling them with sound. The existing instruction excludes music/SFX, and every approved narration word remains unchanged. Do not silently accelerate speech, add synthetic sentences, or move scene boundaries without another explicit timing decision. Keep intentional reading time where it helps.

## Proposed phone edit decision list

[Likely] The following is an initial EDL based on sampled/native still review. Inspect exact in/out frames and all selected footage before implementing; adjust within the same durations if a boundary contains a browser overlay or unsafe frame. Preserve a machine-readable EDL with raw timestamps, crop rectangles, output times, holds and source SHA.

| Output time | Duration | Source and presentation |
| --- | --- | --- |
| Film86–94s | 8s | Source6.2–14.2s: guide visible, normal scroll, fit entire portrait safely. Side copy identifies **iPhone 16 · self-demo** (user-reported) and the synthetic example. |
| Film94–98s | 4s | Source16.0–18.5s: legible guide detail; up to1.5s explicitly labelled held detail if needed. The inset must show the recorded product ring unchanged. |
| Film98–102s | 4s | Source26.2–29.9s: original image in Photos, followed by a0.3s disclosed held frame. Source26.0s is too close to the switcher transition; do not use it. Verify the exact26.2s boundary. Label **Navigation cut**. |
| Film102–112s | 10s | Editorial recap over the last reviewed safe original/detail, labelled held frame. No new action is depicted. |
| X24.0–29.6s | 5.6s | Choose a continuous clean guide window such as10.0–15.6s, with exact matching detail crop on the open side. Do not start at raw0: that is the keyboard, not the guide. No need to insert Photos into this short scene. |

Exclude source0–6.2s and24.2–26.2s, including keyboard/URL entry/loading and the app-switcher transition, from the candidates. Show only reviewed footage, not Photos library thumbnails or account menus. Hiding navigation is an editorial cut, not proof of continuous handoff. Keep the original intact for provenance.

[Likely] A read-only reviewer proposed a more observational alternative within the same26s: source6.2–24.2s (18s of guide), source26.2–29.9s (3.7s of Photos), then a4.3s disclosed detail hold. Use this if the shorter planned windows feel over-edited. Either route preserves the raw original and shows no invented actions; choose after a local preview, without changing voice timing.

## Launch/X timeline

[Certain] Keep the approved slots7.4,8.4,8.2,5.6,11.82,3.18 seconds:

| Time | Treatment |
| --- | --- |
| 0–7.4 | Strong screenshot question and immediate product identity; concise synthetic-example label. |
| 7.4–15.8 | Real privacy review. Add only a short editorial stage label outside the UI if helpful. |
| 15.8–24 | Real model result and agreement gate; keep its qualifier readable. |
| 24–29.6 | Actual phone guide, with an enlarged same-recording target detail and measured captions. |
| 29.6–41.42 | Evidence and failures, readable fixed figures; no decorative motion competing with the numbers. |
| 41.42–44.6 | Clean invitation and URLs; preserve speech through44.51s. |

[Certain] The X cut already has very little unvoiced tail (approximately0.08–0.71s per scene). Do not trim additional speech or add sound to solve a problem that mainly affects the long film.

## Tool choice and research

[Certain] Local discovery found installed Remotion skills: `remotion-best-practices`, `remotion-create`, `remotion-render` and related modules under `/Users/jeeveshsingale/.agents/skills/`. Their local metadata reports4.0.540. A global `remotion` executable was not found; that alone does not establish whether some other local project has the runtime. `/Applications/Open Design.app` exists; its video workflow/export capability has not been verified. Hyperframes and FFmpeg executables exist.

[Certain] Primary sources checked on4November:

- https://www.remotion.dev/docs/ai/skills — official skill list and installation source.
- https://github.com/remotion-dev/remotion/blob/main/packages/skills/skills/remotion-best-practices/SKILL.md — maintainer repository, not an anonymous skill bundle.
- https://www.remotion.dev/docs/animating-properties — frame-driven animation.
- https://www.remotion.dev/docs/sequence — explicit timed composition.

[Likely] **Recommended delivery route: extend the existing builder's deterministic Playwright/CSS cards and FFmpeg composites.** It already renders animation frames and preserves exact audio/captions/durations. Migrating the entire film adds risk without establishing better storytelling. No installation is needed for this route.

[Likely] Remotion is an optional local motion-card authoring route if the builder cannot express a needed graphic. It must feed rendered editorial assets back into build.mjs, preserve the exact timeline, and use the official installed guidance. Inspect local runtime availability first; do not scaffold over existing work. If a Remotion project is created, open and verify its local Studio preview before authoring, as its skill requires. Do not call Remotion Studio a verified capability just because skills are installed.

[Certain] No new skill was installed and no external service received the phone recording. Maintainer provenance is not a security certification. Do not run unknown GitHub setup scripts, upload raw phone footage to a cloud designer, or add a second paid-generation workflow. Open Design is optional and unnecessary for the recommended edit; do not change app settings or sign into new services for it.

## Implementation checklist for the next agent

1. Read this plan, current user replies, AGENTS.md and current RULES/DESIGN, then inspect the working tree. Other sessions have edits; never reset or overwrite them.
2. Recheck source SHA and existing candidate/source/audio hashes. Capture baseline hashes for preserved exports before edits.
3. Review full selected source windows, including all transition boundaries; record the review scope. Confirm synthetic original matches the existing example. Obtain or preserve pending human provenance notes without inventing consent or recipient success.
4. Preserve the original under incoming. Only then copy the same original to `out/raw/recipient.mov` if absent; if present, compare hashes and refuse to overwrite a different file. Keep raw-to-selected-window mapping in an EDL.
5. Modify only video-specific code/docs. Add source-window validation, aspect-ratio-safe fit, truthful source labels and same-recording detail crops in build.mjs (small helper if needed). Never select the first26s blindly. Provenance must record the EDL and unresolved human checks, not infer success from file presence.
6. Replace the stagnant film holds with the specified editorial motion explanations. Keep all approved voice/audio offsets and captions. Mark held frames and navigation cuts. Preserve selected-third-main-recording and shortened-wait disclosures.
7. Add focused tests for invalid/out-of-range phone windows, no silent truncation/padding, fixed slot totals and truthful disclosure. Run audio-plan/alignment checks plus builder preflight before rendering. Test changes to behavior, not pixel snapshots of decorative cards.
8. Render to new candidate tags only, e.g. `phone-motion-20261104-v3`; refuse name collisions. Retain originals, intermediate shots, EDL, receipts and verification. Do not overwrite v1/v2.
9. Verify both complete decodes; exact180.000/44.600s;1080p30 H.264/AAC; no unintended source audio; exact transcript and measured cue timing; no captions over controls; source masks/target unchanged; all metrics/disclosures; privacy review of all selected frames and final export. Log evidence rather than declaring all checks passed in advance.
10. Ask for full human playback on the phone and with headphones. Supply both playable local candidates. Keep remaining source/consent/device/hosting/portal checks explicit. The user uploads/publishes/submits; no deployment or paid model calls here.

Preflight commands from repo root:

```bash
node --test docs/video/film/audio-plan.test.mjs
python3 -m unittest discover -s docs/video/film -p 'test_align_higgsfield.py'
VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments.json node docs/video/film/build.mjs all --check
```

Render only after the revised phone windows and disclosures are implemented and reviewed:

```bash
TAKE='third main recording; selected after earlier attempts' CUT_WAIT=1 CANDIDATE_TAG=phone-motion-20261104-v3 VOICE_MANIFEST=docs/video/out/voice/higgsfield/segments.json node docs/video/film/build.mjs all
```

If that tag already exists, choose a fresh tag; do not remove an earlier candidate. A successful export remains a candidate until human and publication gates are actually completed.

## Open human and release gates

- User confirmed their own iPhone16 self-demo. iOS, coaching/errors and phone take count remain unspecified; do not invent them or an independent recipient.
- Full review of chosen footage and final privacy/readability check on actual phone.
- Full human voice/caption/graphic playback acceptance. Sampling and decode tests cannot substitute for it.
- Separate deployment/source-parity and any still-open project QA gates; this edit neither deploys nor certifies the entire product.
- User-hosted final video URL, signed-out full playback, actual signed-in portal fields/declarations and submission confirmation.

## Resume prompt

> Continue the ShowMe video edit in /Users/jeeveshsingale/dev/ShowMe. Read docs/video/VIDEO-EDIT-PLAN-2026-11-04.md first, then current user replies and project rules. The phone original is preserved at docs/video/incoming/phone-20261104/recipient-original.mov, SHA2563cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068. Inspect current implementation status before redoing work. Use only film/build.mjs with approved narration.txt, x-narration.txt and out/voice/higgsfield/segments.json. Preserve every existing export. Integrate reviewed phone windows with honest detail crops/navigation-cut and held-frame labels; improve long unvoiced tails through editorial motion graphics. Keep exact180s/44.6s and actual speech timing. No new paid generation, deployment, publishing, submission, synthetic product actions or altered metrics. Deliver playable new candidates with verification and explicit remaining human checks.

## Provenance update after the plan was saved

[Certain] The user confirmed this recording was made on their own iPhone16. The ingest receipt and proposed source label now identify a self-demo; the initial request for context is no longer a blocker to that label. iOS and take count remain unknown.

## Local technical check in this planning pass

[Certain] The complete source decodes cleanly when conformed to the intended30fps timeline. A direct null-output test warned about rounded output DTS on this VFR clip; source timestamp inspection found1,730 decoded video frames with strictly increasing PTS (zero non-increasing values). Preserve the raw VFR original and normalize only the edit derivative. The video stream duration is29.991667s, slightly shorter than the30.025034s container/audio extent. The implemented Photos window ends29.6s with a disclosed0.6s hold, avoiding a seek beyond the last decoded action frame.

## Implementation outcome

[Certain] New v5 candidates are180.000s/44.600s. The actual EDL is `film/phone-edit.json`; it supersedes the proposed source-end29.9s and hold0.3s. Side details are explicitly labelled held source crops at16.8s/28.7s, not simultaneous live insets. Privacy/handoff/boundary explanations animate through unvoiced holds. The sharing source's early EOF is handled by an explicit disclosed held link frame; every scene now has its exact approved frame count. FFprobe frame counts are parsed as JSON because its CSV includes trailing commas on some clips. Verification receipts and full build history are retained under `out/`.

[Certain] Audio timing checks, exact caption transcripts, complete decoding, source/export preservation and sampled frame review pass. Human complete playback and publication/submission gates remain open; do not redo generation or use the preserved emulated cuts by accident.
