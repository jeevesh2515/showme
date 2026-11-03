# ShowMe — three-minute recording script

Status: **desktop take selected; improved review cut being assembled; founder voice and physical-iPhone footage pending**.
References: WEB-1, ENG-4, EVAL-7; [filming checklist](filming-checklist.md).
The seven segments total 180 seconds. Speak naturally in English; confidence tags and directions are not spoken.

**[Certain]** This is an illustrative scenario using the existing synthetic billing image, a laptop, the founder's actual iPhone 16 and another consenting person. It demonstrates finding a matching control, not cancellation or a usability-study outcome.

## 0:00–0:15 — Problem and payoff

**Show:** Original synthetic billing image, followed by a brief preview of a genuine finished guide from the recorded take.

**Say:**

> Someone sends you a screenshot: “Where do I press?” Explaining it over the phone can be confusing. ShowMe sends back one visual next step. These billing details are made up.

**Caption/label:** “Illustrative scenario · synthetic billing screen.” Keep this readable at opening. Do not invent a real parent's message, age or testimonial.

## 0:15–0:45 — Privacy before upload

**Show:** Open the live /app page. Choose **Try with an example billing screenshot**. Show the actual automatic masks. Enable **Brush**, hide the name, expiry and address. Inspect every intended region, then choose **Looks private. Continue**.

**Say:**

> I add the screenshot and the goal: cancel my subscription. The browser detects structured details such as emails and card numbers. Detection is partial, so I review the picture and hide the name, expiry and address myself. Only after I continue does the reviewed, redacted image go to ShowMe and Meta.

**Caption:** “Partial detection. Manual review before upload.”

**Gate:** If masking does not cover the intended region, stop rather than narrating a successful privacy check. The improved take uses the cropped 1280×740 example and numeric-mask fix; name, expiry and address are manually covered. Use assets/billing-recorded-v2.png for the exact recorded original. Visually inspect the actual uploaded mask; decision numbers alone do not establish privacy.

## 0:45–1:08 — Two Meta models

**Show:** The genuine response and progressive highlight. The improved selected take has an accepted SAM outline around the intended control. Preserve the actual progressive box-to-outline change. Earlier attempts included a misplaced box, so disclose take selection; do not claim a first-take success.

**Say:**

> Muse Spark names the next control. SAM refines its outline only when the bounding boxes agree and SAM’s box contains Spark’s point. This take produced an accepted outline. If refinement fails the checks, ShowMe keeps the box. Refinement never changes the click point.

**Labels:** “muse-spark-1.3” and “sam-3.1”.

**Gate:** The agreement check concerns the SAM bounding box. Do not say that mask pixels verify the click or that SAM improves click accuracy.

## 1:08–1:48 — Recipient handoff

**Show:** Choose **Share guide (1 step)**. On **Share these steps**, review the image, check **I checked this picture** and the sharing consent, then choose **Create link** and **Copy link**. Record the other person opening the genuine guide on the iPhone. They switch to the original synthetic image, saved in Photos, and identify the matching control.

**Say:**

> I review the image again, consent to sharing, and create an expiring link. The recipient gets one instruction and a highlight. They need to check the intended control on their own screen. This is a picture, not remote control, and no subscription is changed. Another step needs another screenshot. The link expires after seven days.

**Caption:** “Visual guidance, not remote control. No subscription changed.”

**Gate:** The current narration makes no observed-success claim. If the recipient struggles, keep the struggle accurately. Mark any coaching; do not call the staged exchange a usability study. The mobile preview is emulated until replaced by the physical-iPhone recording. A next step requires a new screenshot.

## 1:48–2:12 — Engineering built during the event

**Show:** Two stationary, readable code crops: [browser redaction](../../apps/web/lib/redaction/redact.ts) (reviewed regions painted into a re-encoded image and the redacted return) and [SAM agreement gate](../../backend/showme/core/sam.py) (overlap, point containment, area cap and fallback). Do not scroll through terminals or credentials.

**Say:**

> Here is the engineering I built during the hackathon. The browser re-encodes the reviewed image, and the API client requires that redaction result. Tests inspect the uploaded payload. The SAM agreement gate rejects inconsistent refinement.

**Caption:** “Built during the hackathon · public source.”

**Gate:** The typed API boundary is part of the design, not a standalone runtime privacy proof. Do not present a test count as product readiness.

## 2:12–2:42 — Recorded evidence and limitation

**Show:** A clearly separate presentation card, not fabricated product UI. All four recorded-v3 results have equal-sized figures and labels:

| Recorded measurement | Result |
| --- | --- |
| ScreenSpot-v2 target-point accuracy, n=1,172, SAM off | **89.9%** |
| ScreenSpot-Pro target-point accuracy, n=300 | **62.0%** |
| Says “not visible” on absent targets, n=200 | **75.5%** |
| Live-web development tasks, not unseen | **12/20** |

**Say:**

> On prompt version three, the click point landed inside the labelled target in 89.9 percent of 1,172 held-out grounding examples. When the target was absent, it said “not visible” in 151 of 200 probes, 75.5 percent. Most of the rest still got a highlight, and we publish those failures.

**Card provenance:** “Recorded v3 results · November 2, 2026. Absent-target probes: 151/200; injection probes counted apart, 10/10. One dev/reporting image-goal overlap is disclosed. E2E tasks were used during development.”

**Gate:** These are recorded results, not independently clean held-out honesty or universal completion claims. Of the 49 absent-target misses, 44 have a highlight (37 `ok`, 7 `unsure`), 4 say `done` and 1 is an error, so say “most”, never “all”. If asked, 161/210 = 76.7% is the combined figure with the 10/10 injection probes. Keep the card readable for the entire segment; source links belong in [the video description](description.md).

## 2:42–3:00 — Purpose and links

**Show:** End card with ShowMe, showme-web-delta.vercel.app and github.com/jeevesh2515/showme.

**Say:**

> ShowMe is for the person who receives the screenshot: review locally, send one visual step, and let the recipient stay in control. Try the live app and inspect the code.

**Timing:** Aim to finish speaking at approximately 2:55, then hold through 3:00. The founder's actual timed voiceover determines the final edit; written word counts are not a duration guarantee.

## Integrity and status

- Use the actual recorded model result and actual sharing. No mocked response, reconstructed ring or fake confirmation.
- Label shortened waits and material take selection, for example “Selected from two attempts.”
- Keep no claim that a subscription was cancelled, a parent used it independently, time was saved, or a human study was completed.
- The script's prior reviews were subjective editorial checks: 8.9/10 overall and 9.4/10 factual precision for the earlier wording. This provenance qualification is a factual update, not a new final-video score.
- Final footage, audio, captions, links and the exported 180-second duration still require manual review. See [acceptance checklist](filming-checklist.md).
