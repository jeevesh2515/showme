# Review: ShowMe-proof-fixed-point-20261104-p1.mp4

Dated 4 November 2026. Skeptical review of the 12.1 s proof (1920x1080, 30 fps). Method: ffmpeg frames at 4 per second (48 frames), every frame around 4.0 to 4.33 s, 5.5 to 5.67 s, 8.03 to 8.17 s and 11.2 to 11.4 s, plus 600 px wide downscales of 10 timestamps. Scene-change detector fired at 4.23, 5.6, 7.1, 8.1, 10.23 and 11.67 s. I cannot hear audio. Caption text was compared with docs/video/narration.txt only. No viewer was tested; this is one reader's opinion of the frames.

Frames are in the reviewer's temp directory: /private/tmp/claude-501/-Users-jeeveshsingale-dev-ShowMe/61c33774-c255-4fd0-bc54-5c4abcdccfc8/scratchpad/rv.8Mff

## Blockers

B1. The film ends mid-sentence. At 12.06 s the caption reads "No subscription is changed here," and stops. The narration continues ("another step needs another screenshot"). A proof cut at a comma looks like a render fault. Either end the caption on a full stop or run to the end of the sentence.

B2. The disclosure labels cannot be read at feed size. At 600 px wide the top-left and top-right labels (about 26 px at 1920) fall to roughly 8 px: "Synthetic billing screen, made up for this film" (0 to 4.2 s), "Real result on iPhone 16, self-demo. Private details masked first" (4.23 to 5.6 s), "Navigation cut. Frame held" and "Stabilised on the highlight". The synthetic and self-demo disclosures are the load-bearing honesty items. They are present but effectively invisible on a phone. Raise to at least about 40 px at 1920 or move the key one into the caption band.

B3. Self-demo and "real result" labelling is dropped for the phone payoff. "Real result on iPhone 16, self-demo" is on screen only 4.23 to 5.6 s, 1.4 s, small. The 8.1 to 12.1 s phone shots read "Recorded guide / Stabilised on the highlight" and "The original, in Photos on the same phone". Nothing in 8.1 to 12.1 s says self-demo or founder's own phone, and nothing says the same person made the guide and viewed it. The scrim, badge and ring are real product output but a viewer will assume an independent recipient. Carry "Founder's own iPhone 16, self-demo" through the whole phone sequence.

## Factual claims

- 4.23 to 5.6 s "Real result on iPhone 16": phone-edit.json marks the device as user-reported; this is fine as long as it stays "user-reported" internally. Acceptable on screen.
- 5.6 to 8.1 s caption "and the click point never moves." This is on screen over a sequence of states (Original, Masked in review, Uploaded, Spark box, SAM outline, Recorded guide) with the sub-label "Separate states, same point". The claim is that the click point never moves. The footage does show the Cancel button at the same frame position (about x 960, y 720) across those states, but that is produced by the edit (registration and scaling), not by the product. A viewer will read the film's own alignment as proof of the product claim. The product claim is about SAM not moving Spark's point; the film does not show Spark's point value, SAM refusing to move it, or the agreement gate. The label "Separate states, same point" is honest but tiny (see B2). Soften to "Aligned in the edit" or show the actual x/y.
- 7.1 to 8.1 s "SAM outline" frame: the ring is tighter than the "Spark box" ring, so SAM visibly changed the shape. Good. But no frame shows a case where the gate fails and the box stays, so the viewer sees only the success case. Not a false claim, but it implies SAM always improves the outline. Narration does state the fallback; the film at this length cannot.
- 4.23 s onward caption "In a 2025 study of 1,173 older internet users," appears under the "There." payoff. It is a fragment of a statistic with no resolution in this proof (the 65 percent and the helper line are not shown). A muted viewer reads a half-statistic under a ring. Not a false claim while the proof is incomplete, but it must resolve in the full cut.
- 10.23 to 12.06 s "The original, in Photos on the same phone": supported by phone-edit.json original window (26.2 to 29.6 s, navigation cut 24.2 to 26.2 s excluded). The "Navigation cut" label discloses the skipped steps. Good.
- 11.67 s headline "No subscription changed. Picture only." Accurate and appropriately restrained. It sits on a held frame with no ring on the original, so "Picture only" is also what the viewer sees.
- Missing: nothing on screen in this proof says Muse Spark, SAM 3.1, 2.8 s or seven days. The words "Spark box" and "SAM outline" at 7.1 to 8.1 s are the only mentions, at 8 px at feed size. This is a gap, not a false claim. No testimonial, time saving or improved SAM accuracy is claimed anywhere in the frames.

## Deceptive editing risk

- 4.23 s hard cut (desktop plate to phone guide). This is the highest-risk cut. The last plate frame (4.2 s) is the unmasked desktop screen zoomed on the button, with the question and goal type above it. The next frame is a different device's recording of a masked, dimmed, ringed version, with the question type shrunk and relocated, and the button landing at the same spot. It reads as one continuous action: "the screen I just saw now has the answer". In truth it is a desktop plate and a later phone recording of a separately produced guide, with Stabilised-on-the-highlight warping. The disclosure appears at the cut but is tiny (B2). The masks that appear at the cut also look like a processing step that happened in the 0.03 s of the cut. A cold viewer will believe the app answered the exact image shown. Mitigation: a 0.3 to 0.5 s dissolve or a visible "recorded later on phone" label, and show the mask step before the ring.
- 5.6 s cut. The same button now in an "Original" state at full opacity with unmasked card number 4111 1111 1111 1111, expiry 08/29 and CVC 123 on screen for about 1.5 s. This is a rewind, but the montage does not announce rewind. The viewer who just saw the "There." result sees the source again with no "back to the start" cue. The tiny "Original" label is the only cue.
- 7.1 s cut (Uploaded to Spark box) and 8.0 s (SAM to guide): all desktop product states land on the same coordinates; the dim scrim and ring appear without a visible transition. Appears continuous but is labelled by state. Acceptable given the labels, again subject to B2.
- 8.1 s cut (desktop SAM to phone guide, labelled "Recorded guide"). The ring jumps from a roughly 340 px wide badge/ring to a roughly 700 px one, because the phone shot is a pinch-zoomed recording and the edit scales it. The point holds, but the ring size triples at the cut. Reads as a zoom, not as a device change.
- 10.23 s cut (guide to original). Labelled "The original, in Photos on the same phone" and "Navigation cut". It is honest. But the payoff the narration promises ("which control to find on their own screen") ends with a still image of the control with no ring and no finger. The viewer is shown a button and told it is the one; nothing proves the viewer could locate it. This is the correct restraint, but it is also a weak final image for 1.9 s.
- Held frame: 10.23 to 12.1 s is a single held frame (the scene detector sees no change except the headline swap at 11.67 s). The label says "Frame held". That is truthful.

## Privacy

- No real personal data seen. Every identifier on screen is the synthetic billing page (+44 7700 900123, 12 Example Street, billing@streamflix.example, 4111 card, 08/29, 123).
- 5.6 to about 6.9 s: unmasked synthetic card number, expiry, CVC, phone and address are on screen with only the small "Original" label. The synthetic label that appears at 0 to 4.2 s is not repeated here. A viewer who joins late or screenshots the frame sees what looks like a card number and CVC with no "made up" marker. 4111 1111 1111 1111 is a well-known test number, but that is not self-evident. Repeat the synthetic note in the montage.
- 4.2 s and 11.7 s: unmasked synthetic address and phone are shown in the hook and the final held frame. Intended and labelled (hook only).
- 10.23 to 12.1 s: the phone original frame has a 36 px black strip at the left edge (the phone edge or letterbox). No keyboard, app switcher, library, notification, account name or status bar visible in any sampled frame. Source seconds 0 to 6.2 and 24.2 to 26.2 are excluded as phone-edit.json requires. I saw nothing from those ranges, but I did not map output time to source time, so this is "not seen", not "verified".
- The masks in the guide (black bars) cover name, card, expiry/CVC row, phone, address and support line, consistent with the narration's "I hide those myself". Good. The ring and badge do not cover any mask boundary in a way that reveals content.

## Readability

Full size:
- Headline "Where do I press?" and "There." are large and clear. The goal line "Cancel my subscription" in yellow is clear.
- Product text inside the footage (4.0 s plate, 5.6 s Original) is legible; the plate at 4.0 s is visibly soft from upscaling (the 4 s push-in), noticeable on the "Billing address" row.
- The "1" badge at 4.27 to 5.6 s and 8.1 to 10.2 s overlaps "Billing address" label and the mask bar, hiding half the label ("Billing addre"). Not a privacy problem, a clutter one.
- In the Spark and SAM frames (7.1 to 8.1 s) the footage is dimmed and the ring is only about 200 px wide. Readable at 1920, small at feed size.

Feed size (600 px):
- Headline, goal line and "There." stay readable.
- Bottom caption (about 40 px at 1920, about 12 px at 600) is just readable. The top labels are not (B2).
- The ring in the 5.6 to 8.1 s montage frames (Spark box at 7.1 s, SAM outline at 7.6 s) is about 75 to 90 px wide at 600. Still visible. The thin SAM outline at 7.6 s is hard to tell from the Spark box at that size, so the one visual difference the SAM step exists to show is mostly lost.
- Montage state changes are about 0.5 s each. At feed size the label that explains each state cannot be read in that time even if it were larger.

## Caption collisions

- 3.0 to 4.2 s: the caption "“Where do I press?”" is at the bottom while "Where do I press?" is the 130 px headline above. The same sentence twice, one in quotes. Redundant, not a collision.
- 4.23 to 5.6 s: "In a 2025 study of 1,173 older internet users," sits directly under the phone guide's lower edge (y about 1040 against footage ending at about 925). It does not overlap the footage but is crowded against it, and is the only text under "There." It competes with the payoff for attention.
- 5.6 to 8.1 s: the top-right label "Separate states, same point" and the bottom caption "and the click point never moves." repeat each other. No overlap with footage.
- 11.67 s: the headline "No subscription changed. Picture only." replaces the caption band and pushes the footage up; the footage top edge at y 214 sits about 30 px under the headline. Tight but not overlapping.
- No caption covers the button or the ring in any sampled frame.

## Visual cliches

- Yellow ring plus numbered badge "1" on a dimmed screenshot is the standard annotated-screenshot look. It is the real product output, so it is not decoration, but the film adds nothing around it that separates ShowMe from any tutorial overlay.
- Navy ink band with yellow, heavy condensed headline, and a single yellow accent word ("There.", "Picture only.") is a familiar explainer-ad look.
- "Where do I press?" followed by "There." is a joke structure that works muted. Not a cliche problem.

## Do the marks read as meaning or decoration?

- The yellow notches are four triangles (about 25 px at 1920, about 8 px at 600) on the ink edges, top and bottom at x 960, left and right at y 720. They converge on the Cancel button in the locked frames. At full size an attentive viewer can see they point at the button from all four sides. At feed size they read as small yellow specks.
- 0 to 3.9 s: the triangles move in tiles of the 4 fps sheet (top one drifts from x 600 to 1000 along the band; side ones shift in y). Nothing indicates they are searching for anything; with no visible target they read as UI glitch or loading ticks. This matches the researcher challenge in CONCEPTS.md ("an unexplained yellow wobble").
- At 4.0 s they lock onto the button. The lock happens before the ring appears, so the first payoff cue arrives with no visible cause for the lock.
- From 5.6 s the label "Separate states, same point" explains the device for the first time, at 8 px at feed size. Until then the marks carry no stated meaning.
- Conclusion: in this file the marks are mostly decoration for a cold or feed-size viewer and only become meaning for someone who reads the 5.6 to 8.1 s labels at full size. They do not carry the story on their own.

## First five seconds, cold muted viewer

- 0 s: a big question, a goal line with an obvious action ("Cancel my subscription"), and a recognisable billing page with a Cancel button visible. The viewer can infer: someone wants to cancel, doesn't know where to press. This works, and the "Screenshot + goal:" line states the input. This is better than the CONCEPTS.md draft because the verb line is present.
- 0 to 4.2 s: 4.2 s with no change except a slow push-in and wandering notches. No motion carries information, no cue that an answer is coming. For a feed viewer this is a long static hold before the first payoff.
- 4.23 s: ring and "There." answer the question. Comprehensible: "an app circled the button". It does not say what produced the circle, whether it saw private data, or that the data was masked, except in the tiny label (B2). The masks now visible on the footage are the only hint that something was hidden, and nothing tells the viewer why.
- 4.23 to 5.6 s: the caption "In a 2025 study of 1,173 older internet users," is a statistic fragment unrelated to the picture. A muted viewer is left with an unfinished clause.
- The privacy-review step (the browser masking before upload) first appears at about 6.0 s in the "Masked in review" frame, unlabelled at feed size. The CONCEPTS.md challenge asked for it by about 8 to 10 s; it is there, but unreadable.
- "Cancel my subscription" in the opening, with the ring on Cancel, may lead a viewer to expect a cancellation; the closing headline at 11.67 s corrects this. 7 seconds elapse between the impression and the correction.

## Most useful fixes (in order)

1. End on a complete caption (B1).
2. Make the synthetic, self-demo and navigation-cut labels large enough to read at 600 px, and carry the self-demo label through 8.1 to 12.1 s (B2, B3).
3. Soften the 4.23 s cut with a short dissolve or a "recorded later on phone" cue, and show the mask step before the ring.
4. Make the notches larger, or lock them on the button from 0 s, and drop the search motion; add a plain-words label for what they mean by the first montage state.
5. Repeat "made up" on the 5.6 s Original frame with the unmasked card data.
6. Reword or soften "the click point never moves" so it does not rest on the edit's own alignment; show the Spark x/y if the claim is kept.
7. Replace the half-statistic caption under "There." or hold it until the clause can finish.
8. The final held original frame (10.23 to 12.1 s) carries no new information for 1.9 s. Shorten it or use real footage of the founder locating the button; do not draw a ring on it.


## Final cuts review (fixed-point-20261104-v2)

Dated 4 November 2026. Skeptical review of docs/video/out/ShowMe-3min-hackathon-candidate-fixed-point-20261104-v2.mp4 (180 s) and ShowMe-X-launch-candidate-fixed-point-20261104-v2.mp4 (44.6 s), both 1920x1080, 30 fps. Method: ffmpeg frames every 2 s (film) and every 0.5 s (X), 4x6 contact sheets at 480 px per tile, extra single frames at cut points, full-size and 600 px wide views of key frames, .srt compared with what is on screen. I cannot hear audio, so narration and music sync are unchecked beyond the .srt times. I did not map output time to phone source time, so "no keyboard, switcher, notification, library or status bar seen" is a statement about the frames I sampled, not a proof against phone-edit.json. Frames are in the reviewer's scratchpad under fc/. One reader's opinion; no viewer was tested.

Earlier section (proof p1): B1 (caption cut off) and B2 (tiny disclosure labels) are fixed in these cuts: captions end on full stops, labels are now about 30 px at 1920. B3 (self-demo label dropped on phone footage) is mostly fixed: "iPhone 16 self-demo" is on every phone shot in both cuts. The 4.23 s cut critique is addressed by the "Recorded separately" label. The "click point never moves" claim is now carried by labelled real numbers (Spark x 482, y 632; box overlap 0.89 vs 0.5; area 0.7% vs 25%) plus "Separate states, aligned by this edit". Good.

### Blockers

Both cuts
- Live share link on screen. Film 1:22 to about 1:25 (frame at 82 and 84 s) and X 24.0 to 26.4 s show the full guide URL https://showme-web-delta.vercel.app/g/REDACTED_GUIDE_TOKEN, "deletes itself on Monday 9 November", and in X a "Copied" state. It is a capability URL that is still valid until 9 Nov. Content behind it is the masked synthetic screen, so harm is low, but it is a bearer token in a public video. Blur or crop the token, or press "Delete now" on that guide before publishing and say so; do not post with the token legible.

X cut
- 40.0 to 42.4 s: "62.0%" is stacked over "on harder professional apps" and, directly beneath, "12 of 20 live-web development tasks". 62.0% is ScreenSpot-Pro 186/300; 12/20 is the separate live-web set (60%). Read as one block, the live-web line looks like the numerator of 62.0%. The 186/300 count is not shown. Split into two cards, or drop the live-web line from the X cut, and add "186 of 300, ScreenSpot-Pro, SAM off".
- 40.0 to 42.4 s: caption "The failures are public." is the only narration; nothing spoken or captioned says what 62.0% is. A muted viewer gets a bare percentage with the word "failures" and no denominator.
- Nowhere in the X cut does it say no subscription is cancelled or that the billing screen is made up, except "Synthetic billing screen, made up" 0 to 4 s and the end-card label at 41.4 s. For 4 to 41 s the Cancel button is ringed on a screen the viewer may take as real, goal "Cancel my subscription" in the opening. The film says "No subscription is changed here" (1:36 to 1:40); the X cut dropped it. Add a short line, for example "Nothing is cancelled. Picture only." near the phone payoff or the 26 to 29 s phone shots.
- 4.0 to 5.5 s top-right label reads "Recorded separately. Stabilised" and stops (full size frame at 4.0 s). The sentence is cut off, and it appears to be the truncated "Stabilised on the highlight" used elsewhere. The film at 4.3 s reads "Recorded separately. Masked first", so the X cut shows a different, broken label for the same shot. Fix the string.

### Factual and evidence checks (what passed)

- 1,054 of 1,172 = 89.9% (X 35.1 to 39.2 s; film 2:12 to 2:20), labelled "ScreenSpot-v2", "Prompt v3, Spark minimal, SAM off", "held-out". Matches.
- 186 of 300 = 62.0% in the film (2:20 to 2:26): correct, labelled ScreenSpot-Pro. Only the X cut conflates it (above).
- 151/200 = 75.5% "of probes", "44 of the other 49 still got a highlight": present in both cuts, with the qualification on the same card. Good; the X cut also keeps it spoken-adjacent.
- 12/20 "Development tasks, not an unseen set" and the injection footnote "10 of 10, 1 image pair overlaps dev and reporting" in the film summary table (about 2:30 to 2:44): correct and appropriately hedged, but the footnote is about 14 px at 1920 and a 14 s hold; readable on a laptop only.
- 2.8 s and under 1c (film 55 to 59 s): card reads "Median measured grounding call, prompt v3. Not the whole workflow. This call: 1.9 s, $0.0036." Qualified correctly. The X cut does not use it.
- SAM: "outline only if box agrees", click point never moves, shown with gate numbers. No improved-accuracy claim anywhere. Good.
- No testimonial, time saving or recipient-study claim. Self-demo is stated on every phone shot.
- External claim, film 0:04 to 0:15: "2025 study of 1,173 older internet users, 65 percent got tech help from family", source line "Journal of Applied Gerontology, 2025". I cannot verify it from the repo. It is outside the stated evidence list, so confirm the citation before posting. 1,173 next to the eval's 1,172 invites a misread; consider rounding or dropping one.
- X 20.5 to 23.3 s headline "SAM 3.1: box agrees, 0.89": the 0.89 has no label in the X cut (the film labels it "Box overlap 0.89, needs 0.5"). Add "overlap" or drop the number.

### Deceptive-editing checks

- X 4.0 to 7.4 s: the phone guide payoff (ring on Cancel) comes before the masking step (7.5 s on), so the film runs result then process. Labelled "Real result", "Recorded separately". Acceptable as a hook, but the label on the first 1.5 s is the broken one above, so the disclosure that carries this is the one that is cut off.
- X 7.5 to 11.0 s and film 20 to 29 s carry the label "Frame held" while the cursor visibly moves between sampled frames. If the page is held and only the cursor is live, say "Page held"; as is, the label reads as false for a moving cursor. Not seen to imply a tap.
- Navigation cut label ("Navigation cut. Frame held") on the original-in-Photos frame (film 1:38 to 1:44; X 29 to 29.5 s): honest. The unmasked synthetic phone, address and "08/29 / 123" show here with the top label "iPhone 16 self-demo, the original" but no "made up" marker; the synthetic note is not repeated until the end card. Minor.
- No frame implies a tap or cancellation. The film states it explicitly at 1:36 to 1:41.
- Film 8 to 10 s: unmasked CVC "123" and expiry "08/29" are visible in review frames (also X 7.5 to 11 s, feed size) while captions say details are masked; this is the "Detection is partial" step and is explained in the film from 0:29. In X the explanation ("hide anything it missed") arrives at 11 s, after about 3.5 s of a half-masked page captioned "masks private details". Synthetic data, but a muted viewer sees a leak under a masking caption.

### Privacy

- Besides the share link: no keyboard, app switcher, notification, photo-library thumbnail, real account name or secret seen in sampled phone frames (film 4 to 10 s, 1:24 to 1:44; X 4 to 7.5 s, 26 to 29.5 s). The Dynamic Island pill is visible at film about 1:26 (phone top edge); no status bar. Black strip at left edge of the phone original frame (film 1:38 to 1:50, X 41.5 s caption "A picture, not remote control" frame): letterbox, not content.
- All identifiers on screen are synthetic (billing@streamflix.example, +44 7700 900123, 4111 card, "Jane Doe", "Signed in as" masked). The repo URLs and github.com/jeevesh2515/showme on the end card are the founder's own public handles; that is intended.
- Source text excerpts (film 1:36 to 1:56) show only code lines, no keys.

### Collisions and cut-off text

- Film about 0:08 (frame at 8 s): the left text "1,173 older internet users surveyed" is overlapped by the phone-guide panel sliding in; the panel clips "older" and "surveyed". Collides for roughly one second.
- Film 4.2 to 10.5 s: a single caption "In a 2025 study of 1,173 older internet users," is held 6 s under a recorded phone guide whose content does not change; caption then resolves at 10.5 s ("65 percent got tech help..."). Mismatch of picture and words for 6 s, and the fragment is again a half-statistic for a muted viewer.
- X 4.0 to 7.4 s: the "1" badge covers "Billing addre" label (cosmetic, same as p1). No caption covers the button or ring.
- X end card 42.4 to 44.6 s: github line appears at 43.6 s; caption "ShowMe." then "Try it, and read the code." No cut-off. The credit line at film 2:50 to 3:00 ("Built solo during the Meta Global AI Developer Hackathon. Indie Track, Build for Your World. AI-generated narration.") is about 12 px at 1920: not readable at feed size, fine at full size.

### X cut at feed size (600 px wide)

- Readable: "Where do I press?", "There.", all big-number cards (89.9%, 62.0%, 151/200, 12/20 are huge), headline captions ("Muse Spark finds it", "Send a seven-day link"), end card.
- Marginal: top-left/top-right labels (about 13 px at 600): "Real result on iPhone 16, self-demo", "Frame held", "Prompt v3, SAM off". Legible only on a good screen; these carry the disclosures.
- Not readable: card-sublines such as "1,054 of 1,172 held-out examples, ScreenSpot-v2" and "44 of the other 49 still got a highlight" (about 12 to 14 px at 600), the whole "Target absent. Real call: not_visible" app frame (29.5 to 35 s: tiny "Scroll down" UI, ~1 s of caption "ShowMe says not visible on 151 of 200..." over a 3 s unreadable screenshot), and the masked-form frames (7.5 to 16 s: the masks and lock icons are about 4 px). The "44 of 49" qualifier is the honesty item that is smallest.

### X cut muted

- 0 to 4 s works: big question, goal line, billing page.
- 4 to 7.4 s works: ring, badge, "There."
- 7.5 to 16 s (8.5 s): same masked form, nearly static, caption-only explanation; the viewer cannot see what was masked or what was added by hand. Weakest muted stretch; a shorter, larger before/after of one field would carry it.
- 16 to 24 s: "Muse Spark finds it" over a plain masked screen for about 3 s with no ring, then ring, then SAM outline in 2 to 3 s. SAM Box vs outline difference is hard to see at 600 px (see p1 note).
- 29.5 to 35 s: three holds of a small-text screenshot and two numbers; the spoken "not visible on 151 of 200" has no visual until 31.5 s.
- 40 to 42.4 s: 62.0% plus 12/20 with caption "The failures are public." is confusing muted (see blocker).
- Muted total: the problem and the payoff are clear; the privacy review and the evidence are not self-explanatory without sound.

### Long holds that do not earn their time

- Film 4.2 to 10.5 s (6 s, same phone frame, half-statistic caption).
- Film about 1:56 to 2:07 (11 s): code excerpt then "same grounding core" slide; the SRT has a 6 s gap (2:00.75 to 2:07.08) with a "New goal, same screen" frame and no caption: the longest silent section.
- Film 2:36 to 2:44: summary table with tiny text, 8 s hold, then 2:44 to 2:45 gap.
- Film 38.9 to 43.6 s: 4.7 s of no caption over the "Looks private. Continue" review screen (it holds the "This review can't be skipped" payoff; acceptable, one beat could go).
- X 11 to 16 s and 44.0 to 44.6 s are static; X end card is a 2 s hold, appropriate.

### Taste (not blockers)

- Four yellow edge triangles persist on every frame in both cuts. They still read as stray specks or compression artifacts at 600 px; they do not carry meaning to a cold viewer. Either lock them to the highlighted control with a label or remove.
- Navy ink with yellow numerals and a single accent word is a familiar explainer look; the numbers cards at 40+ s are plain, with large empty space between the headline and the number (headline at y about 180, number at y about 650).
- "Where do I press?" followed by "There." works. The yellow ring and "1" badge are the real product output, but the film around them is generic.
- The "Muse Spark finds it" headline card (X 16 to 19 s) shows a masked page with no ring, so the claim precedes its proof by about 3 s.

### Top fixes, in order

1. Remove or blur the live share URL (film 1:22 to 1:25; X 24 to 26.4 s) or delete the guide first.
2. X 40 to 42.4 s: separate 62.0% (186/300 ScreenSpot-Pro) from 12/20 live-web; add the 186/300 count; caption what the number is.
3. X: fix the truncated "Recorded separately. Stabilised" label (4.0 to 5.5 s) and add "Nothing is cancelled" and a synthetic-screen note on the 4 to 29 s span.
4. Verify the 2025 older-users citation; reconsider 1,173 beside 1,172; fix the "older internet users surveyed" collision (film about 8 s) and shorten the 6 s caption hold.
5. Replace "Frame held" with "Page held" where the cursor moves; label "0.89" as box overlap in X.
6. Enlarge the "44 of 49 still got a highlight" line and the top disclosure labels for the X feed; shorten X 7.5 to 16 s and 29.5 to 35 s.
