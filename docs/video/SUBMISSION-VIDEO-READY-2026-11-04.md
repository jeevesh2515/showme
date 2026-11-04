# ShowMe video delivery · 4 November 2026

[Certain] The new local cuts are exported and technically verified. **Human playback approval, hosting/access and actual submission remain open.** These are submission/launch candidates, not a claim that the project has been submitted or all release gates have passed. References: WEB-1, ENG-4, EVAL-7.

## Use these files

- Submission,180.000s: `out/ShowMe-3min-hackathon-candidate-phone-motion-20261104-v5.mp4`
- Launch/X,44.600s: `out/ShowMe-X-launch-candidate-phone-motion-20261104-v5.mp4`
- Technical evidence: `out/phone-motion-20261104-v5-verification.json`
- Actual phone EDL: `film/phone-edit.json`
- Original preserved under both `incoming/phone-20261104/recipient-original.mov` and `out/raw/recipient.mov`, byte-identical to the user-supplied file.
- Original source digest: `3cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068`.

## What changed

[Certain] Genuine user-provided phone recording replaces the emulation in both cuts. The user identifies it as their own iPhone16. The edit says **self-demo**, never an independent recipient test. Keyboard/loading and the app-switcher interval are excluded. The full portrait view is fitted without cutting off the bottom; a separately labelled held crop makes the real button readable. The product's mask and highlight are unchanged. The unredacted Photos image is the existing synthetic billing example, not a real account.

[Certain] The long film holds now contain animated explanations of detection/manual review/upload, the guide-to-original relationship, and the browser/API/shared-core boundary. Intentional reading holds remain. Callum's exact approved narration and measured speech timing are preserved; no music, SFX, new speech, avatar or replacement product footage was generated.

[Certain] A new per-scene frame-count gate caught a real source/timeline difference: the desktop source ended before its final marker, shortening the sharing shot. The edit now discloses its final held link frame and conforms each scene to the approved frame count. Both the original failed intermediates and all previous exports are preserved. Do not use the failed v3/v4 workspaces or earlier emulated cuts for submission.

## Verification and its limits

- [Certain] 1920×1080,30fps H.264/AAC48kHz. Submission5400frames; X1338frames. Each scene matches its approved frame budget, not merely the final container duration.
- [Certain] Complete decode of both exports succeeds with empty error logs. Approved SRT words and all cue times match the authoritative transcripts/manifest. Fingerprints of all43film and14X rendered caption images were checked against the decoded caption tracks; maximum cue-boundary difference is one frame (0.0334s).
- [Certain] All13 source narration checks find0ms lag at the planned offsets. Final audio matches the normalized reference mix at correlation above0.99997. Source correlations differ because loudness normalization/limiting changes amplitude; that is retained in the receipt rather than misreported as bit-identical audio.
- [Certain] Old exports match their pre-edit digests; all1340 sealed desktop/absent source identities match. Phone source is unchanged. New file names preserve earlier work.
- [Certain] Main-agent review covered27 full-resolution film frames,8 X frames, phone source samples at8fps and source/boundary checks. An independent reviewer checked8 critical final frames and3 film contact sheets, finding no remaining visual blocker. Captions clear the target and disclosures in those samples. **This is sampled perceptual review, not a claim that a human watched every frame.**
- [Certain] The evidence card retains1054/1172 (89.9%),186/300 (62.0%),151/200 (75.5%),44 highlighted among the other49 absent probes, and12/20 development tasks. It retains injection/overlap and selected-main-take qualifications. No evaluation data was edited or rerun.
- [Certain] Narration remains **AI-generated narration**. Desktop take selection, shortened waits, phone navigation cuts and held detail frames are disclosed. The phone's take count/iOS were not supplied; no values are invented.
- [Certain] New editing spend:0credits and0Meta calls. Historical Higgsfield net spend6credits (8charged minus2refunded); fresh MCP balance during this edit:4credits. No deployment, publication, upload or submission by this task.

## Your exact next steps

1. **Watch the180s candidate completely with headphones.** Then watch it on your actual phone in landscape, including once muted. Check that the original image is synthetic, no personal notifications/thumbnails appear, every spoken number is correct, the button is readable, and captions/disclosures stay clear. If anything fails, identify the timestamp before uploading.
2. If you know the phone take count and iOS version, record them in the provenance notes. These are currently unknown; the film makes no claim about them. A separate recipient usability test remains unperformed and is not implied by this self-demo.
3. **Upload the180s file** to the host accepted by the submission portal; wait for HD processing. Use the44.6s file separately for launch/X. Do not append extra steps to the180s film.
4. Open the actual hosted video in a signed-out/private browser and watch it fully. Confirm that someone without your account can play it, plus access the live app and public repository.
5. Put that real accessible video URL into `docs/SUBMISSION.md` and the actual portal. The local MP4 path is not a public video URL; the placeholder remains until the user provides an actual hosted URL.
6. Review team/project fields, model roles, limitations, rights and organizer declarations in your own participant account. Reconcile any separate outstanding product QA/deployment gate before claiming it complete. This video edit does not deploy or certify the whole product.
7. Submit once and keep the real confirmation. A finished MP4, prepared form or uploaded link is not submission confirmation.

## Resume safely

[Certain] Start with this document, `VIDEO-EDIT-PLAN-2026-11-04.md`, current user replies and the verification JSON. Do not regenerate narration or redo paid calls. `film/build.mjs` remains authoritative. Any further change needs a new candidate tag; never overwrite v5, previous candidates, raw recordings or alternative pipelines. Keep full human playback and hosting/submission checks explicit until they are actually performed.
