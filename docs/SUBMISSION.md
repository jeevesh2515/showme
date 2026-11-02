# Meta Global AI Developer Hackathon: ShowMe Submission

- **Track**: Indie Track
- **Project Name**: ShowMe
- **Live Web App**: [https://showme-web-delta.vercel.app](https://showme-web-delta.vercel.app)
- **Live API Health**: [https://showme-api-xi.vercel.app/v1/healthz](https://showme-api-xi.vercel.app/v1/healthz)
- **GitHub Repository**: [https://github.com/jeevesh2515/showme](https://github.com/jeevesh2515/showme)
- **Evaluation Dashboard**: [https://showme-web-delta.vercel.app/eval](https://showme-web-delta.vercel.app/eval)

---

## 1. One-Line Elevator Pitch

> Screenshot + goal → one highlighted step at a time on your own screen. Detected private details are masked on your device and you review the result before anything is uploaded. A guide step can be shared with a remote relative as an expiring link.

---

## 2. The Problem & Founder Story

65% of older internet users surveyed got tech help from family at least some of the time (["How Older Adult Internet Users Stay Online When Technical Problems Arise"](https://www.researchgate.net/publication/392981775_How_Older_Adult_Internet_Users_Stay_Online_When_Technical_Problems_Arise), Journal of Applied Gerontology, 2025, N=1173). That help often starts with a screenshot sent to a relative:

- *"How do I cancel this gym membership?"*
- *"Where is the renew button on the passport website?"*
- *"Why is my screen asking for cookies?"*

Today, there are two bad options:

1. **The phone call**: "What do you see now? No, not that blue button, the small link under the picture." Neither side can see what the other means.
2. **Screen Sharing & Cloud AI Uploads**: Traditional remote support software requires intrusive installs, and uploading unredacted screenshots to cloud chatbots exposes bank details, credit card numbers, personal emails, and private documents.

**ShowMe solves this for the remote helper:**
When someone you help sends a screenshot, drop it into ShowMe. ShowMe detects emails, phone numbers, payment card numbers, UK postcodes, IBANs, and long digit strings in the browser and masks them. Detection is partial: it does not recognise arbitrary text such as a visible typed password or a name, so the mandatory review screen is where the helper hides anything else. ShowMe then finds the exact control to press using Meta's `muse-spark-1.3`, highlights it with `sam-3.1`, and can generate an **expiring, 7-day guide link**. One screenshot yields one step; a multi-step guide needs a further screenshot for each later step. Privacy scope: ShowMe guarantees that only the redacted image is uploaded to its backend and to Meta. In a WhatsApp flow the helper already received the raw screenshot from the recipient through the messaging service, and ShowMe cannot undo that.

The stuck relative opens the link on their phone and views the highlighted screenshot step by step with Previous and Next buttons. The guide is a picture: tapping it does not operate their real app. The creator's delete key removes it at once. Access ends after 7 days; stored images are then removed by the next successful daily purge.

---

## 3. Meta Models Used & Architectural Depth

ShowMe combines two complementary Meta models through a multi-stage visual pipeline:

1. **`muse-spark-1.3` (Grounding & Reasoning)**:
   - Grounded visual comprehension using Meta API with strict JSON schema constrained decoding.
   - Operates with `reasoning_effort=minimal` to achieve p50 2.8 s and about $0.006 per step (prompt v3, 1,172 calls, $7.149), making interactive guidance feasible.
   - Pinpoints user controls on a normalized 0–1000 coordinate grid, identifies next actions, and generates plain-language, single-sentence instructions with safety cautions.

2. **`sam-3.1` (Segment Anything Model)**:
   - Evaluates the bounding box proposal from Spark to produce an SVG outline for irregular buttons, icons, and menus.
   - Governed by a strict **Agreement Gate**: outlines are rendered only if the bounding box of the SAM mask has IoU $\ge 0.5$ with the model box, contains the click point, and covers $\le 25\%$ of screen area. The check uses that bounding box, not the mask pixels. Otherwise, the clean model box is shown as a safe fallback.
   - Human rating of outline quality is not run (section 5), so outline quality versus boxes is unmeasured. On the 100-sample ScreenSpot-v2 SAM ablation (prompt v1), the 86 gated samples scored mean IoU 0.5145 for SAM and 0.5596 for the model box on those same samples, so SAM does not beat the box on geometry. That is why the box stays unless SAM agrees (`eval/results/2026-10-29-screenspot-v2-heldout-n100-62ed230b-muse-spark-1.3-minimal-samon-max2560-pvv1-80346d48/report.md`).

---

## 4. How ShowMe Differs

| Feature | ShowMe | Microsoft Copilot Vision | Google Gemini Live | Enterprise DAPs (WalkMe) |
| :--- | :--- | :--- | :--- | :--- |
| **Client-side redaction before upload** | Yes, partial: OCR + regex masks structured data, and a mandatory manual review covers the rest. Only the redacted image is uploaded. | Not documented | Not documented | Not reviewed |
| **Platforms** | Web app; the helper can use any screenshot from iOS, Android, Mac, or Windows | Windows, web (screen share), and Copilot mobile app (camera) per Microsoft support | Android and iPhone/iPad (camera and screen sharing) per Google support | Not reviewed |
| **Shareable expiring guide link** | Yes (7-day expiry, creator delete key) | Not documented | Not documented | Not reviewed |
| **Reports "not visible" and refusals** | Yes, with measured rates (section 5; 75.5% on absent targets at prompt v3, and 44 of the other 49 still get a highlight) | Not documented | Not documented | Not reviewed |

*Sources, all as of 2026-11-01: Microsoft, [Using Copilot Vision with Microsoft Copilot](https://support.microsoft.com/en-gb/topic/using-copilot-vision-with-microsoft-copilot-3c67686f-fa97-40f6-8a3e-0e45265d425f) (desktop Windows or web screen share; mobile app camera); Google, [Gemini Apps Help: Talk naturally with Gemini Live, iPhone & iPad](https://support.google.com/gemini/answer/15274899?hl=en&co=GENIE.Platform%3DiOS) (Gemini mobile app on iPhone/iPad, with camera and screen sharing). "Not documented" means we did not find it in those pages, not that the product lacks it. Tech help statistics: Journal of Applied Gerontology (2025, n=1,173).*

---

## 5. Measured Evaluation & Honesty

We publish all evaluation numbers directly from raw output files in our open-source repo:

- **ScreenSpot-v2 Benchmark (Held-out, n=1,172, prompt v3)**: **89.9%** click accuracy (prompt v1: 90.7%).
- **ScreenSpot-Pro Benchmark (Held-out high-res apps, n=300, prompt v3)**: **62.0%** click accuracy (`muse-spark-1.3`; prompt v1: 63.7% Spark, 66.7% Wonder).
- **Negatives & Honesty Suite (Held-out absent probes, n=210, prompt v3)**: **75.5%** (151/200 absent pairs) returned `not_visible`; injection probes counted apart 10/10; combined 161/210 = 76.7% (prompt v1 combined: 62.4%). These splits are by annotation, so they share screenshots with the development split, and one negatives image and goal pair appears in both.
- **Safety Refusals (Safety probe suite, n=12, prompt v3)**: **100.0%** refused requests attempting credential harvesting or unsafe actions.
- **20-Task End-to-End Live Web Suite (prompt v3, fixed predicates)**: the 2026-11-02 re-run records **60.0% (12/20)** on real live websites (BBC, NHS, Gov.uk, Netflix, Apple, IKEA), average 4.45 steps (`eval/results/2026-11-02-e2e-bb543ba-04574992c7/report.md`). An earlier 14/20 run had 4 suspect passes; those predicates were fixed with offline tests, and in this re-run the previously suspect caption task fails honestly. Failures include a bot wall, cookie banners, download-as-success tasks, one model 502 and one 504. No unseen E2E task set exists yet.
- **SAM Highlight Quality (89 live steps, 2026-11-02 run)**: 66 SAM outlines, 9 model boxes, 14 no-highlight/scroll states; human grading is **not run** (all cells in that run's `highlight_ratings.csv` are empty), so no claim is made that outlines beat boxes.

---

## 6. Video Demo Script Summary (3:00, per participant guide)

Illustrative scenario with a made-up billing screenshot. Full script: [docs/video/script.md](video/script.md).

- **0:00 - 0:15**: The problem. Someone sends a screenshot asking where to press. On a call, neither side can see what the other means.
- **0:15 - 0:45**: Privacy before upload. The browser masks structured details; detection is partial, so the helper reviews the picture and brushes out a name. Only the reviewed, redacted image goes to ShowMe and Meta.
- **0:45 - 1:08**: Two Meta models. `muse-spark-1.3` identifies the next control. `sam-3.1` refines the highlight only when its bounding box agrees with Spark's box and contains Spark's point. Otherwise the box stays, and refinement never moves the click point.
- **1:08 - 1:48**: Recipient handoff. Second review, consent, expiring link. A consenting person opens the guide on an iPhone 16 and finds the matching control on the original example. It is a picture, not remote control, and no subscription is changed. Another step needs another screenshot.
- **1:48 - 2:12**: Built during the hackathon. Code on screen: the browser re-encodes the reviewed image, and the SAM gate rejects refinement whose bounding box disagrees.
- **2:12 - 2:42**: Recorded results at prompt v3: 89.9% ScreenSpot-v2, 62.0% ScreenSpot-Pro, "not visible" on 75.5% of absent targets (151/200) and 12/20 live-web development tasks. 44 of the other 49 absent-target cases still get a highlight.
- **2:42 - 3:00**: Live URL, public repo, close. Captions on, no music over the UI.
