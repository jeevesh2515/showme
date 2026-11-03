# Video research and production decisions · November 2, 2026

References: WEB-1, ENG-4, EVAL-7. Research precedes the edit; no model calls needed.

- [Certain] The public [Meta event page](https://dev.meta.ai/events/global-hackathon) confirms the indie track judges creativity, technical ambition and whether it works, and lists November 4 at 9 PM ET as the submission deadline.
- [Certain] Fresh Firecrawl and browser visits to the [participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details) redirected to login in this session. Three-minute length and detailed weights therefore rely on the earlier authenticated verification recorded in HACKATHON.md D51; they were not freshly reverified here. No terms or submission fields changed.
- [Certain] [YouTube upload guidance](https://support.google.com/youtube/answer/1722171?hl=en-GB) recommends MP4, H.264, progressive scan, 4:2:0, front-loaded moov atom and 48 kHz AAC-compatible audio. Review cut: 1920×1080, 30fps timeline, H.264, AAC, faststart. Raw variable-time screenshots are conformed to that timeline.
- [Certain] [YC's launch-video discussion](https://www.ycombinator.com/library/fY-this-is-how-you-should-actually-make-launch-videos) considers founder delivery, product story and distribution. [Likely] Keep founder voice and visible workflow central; generated cinematic scenes would supply no evidence for this product.
- [Certain] A read-only reviewer recomputed the current kit's numbers from raw artifacts: 1054/1172, 186/300, 151/200, 44 highlighted absent-target misses and 12/20 development tasks. Evidence-card sources remain unchanged.
- [Certain] Existing capture shows a genuine mistake: the instruction names Cancel subscription, but the model point is (482,660), below the button at approximately y614–652 in the 1280×800 source. SAM returns mode=box. The edit preserves the product's ring unchanged and narrates the low placement.
- [Certain] Existing `phone` capture is Chromium emulation, despite its Safari user-agent string. It is labelled as a mobile preview and must be replaced with the physical-iPhone recording before final acceptance.
- [Certain] Raw live-model provenance is supported by saved step/refine responses and the prior capture/spend records. This resumed edit did not observe the original request live. No replacement output is generated or painted onto footage.
- [Certain] Prior video-related spend entries and experiment labels mean total attempt count cannot safely be inferred from the single selected capture. Review cut states “Selected recorded take; earlier attempts logged”, never “first take”. Exact count remains a publication gate.
- [Certain] The saved uploaded image was inspected: synthetic name, card, expiry, CVC, phone, address and email are masked. Manual corrections, including the partial card detection, remain visible in the edit.
- [Certain] The public guide was reopened in the browser and displays Monday 9 November expiry. No new guide was created.

- [Certain] Concurrent commit f20c4f5 cropped the current public billing example from 1280×800 to 1280×740. The selected recording predates that change. `assets/billing-recorded.png` preserves the exact earlier fixture from Git; use it for the opening and recipient Photos so the screens match. No application change was reverted.

- [Certain] The main narration.txt changed concurrently after asset generation. The shared-kit provenance check correctly detects that mismatch. This review cut now freezes its actual speech in film/review-narration.txt and film/review-scenes.json; its own manifest hashes those files. No concurrent narration edits were overwritten.

## Completion boundary

The review cut is a real assembled video with rehearsal speech, draft captions and an explicitly labelled mobile-browser preview. Founder voice, physical-iPhone footage, caption alignment and independent final acceptance remain required. Do not upload the review cut as the completed submission film.


## Improved selected take — continuation

- [Certain] The previous goal turn made concrete progress by exporting a review cut. On continuation the incoming folder was still empty, but authoritative raw capture files had changed through parallel work. The newer response places point (482,632) in the cancellation button and returns mode=outline with box (392,612)–(564,652). Both the recorded screen and uploaded 1280×740 mask were visually inspected.
- [Certain] The user said they had not started voice recording and chose the improved take. The dedicated review narration and founder handoff now describe that take. Earlier misplaced-box footage is archived under out/take-v1/, and take selection remains disclosed.
- [Certain] Discovered that the old assembler cached conformed source videos merely by file existence while out/raw/ was being rewritten. A later manifest could therefore hash raw data different from the footage used. The earlier manifest is superseded: it is not reliable proof of that raw-to-video association. The improved take is copied to out/take-v2/raw/, verified byte-for-byte against its source, sealed in source-hashes.json, and rebuilt into a separate edit cache. Assembly refuses changed sealed files.
- [Certain] A fresh mobile-browser recording opens the same selected guide URL (_VhzwgWaKPusAhSBhVzuSA). ONLY=phone performed GET/navigation only; capture reports zero priced responses and $0. This remains Chromium emulation and is labelled; it is not physical-iPhone evidence.
- [Certain] The reviewed output retains an accepted SAM outline unchanged. This is one selected example, not a claim that SAM improves accuracy or that the recipient succeeded. Actual iPhone, founder voice and final speech alignment remain missing.
