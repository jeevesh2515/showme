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

65% of US adults aged 65+ get tech help from family at least sometimes (Journal of Applied Gerontology, 2025, n=1,173). That help often starts with a screenshot sent to a relative:
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
   - Operates with `reasoning_effort=minimal` to achieve low latency (~2.0 s p50) and low cost ($0.0051/call), making real-time interactive guidance feasible.
   - Pinpoints user controls on a normalized 0–1000 coordinate grid, identifies next actions, and generates plain-language, single-sentence instructions with safety cautions.

2. **`sam-3.1` (Segment Anything Model)**:
   - Evaluates the bounding box proposal from Spark to produce pixel-perfect SVG outline highlights for irregular buttons, icons, and menus.
   - Governed by a strict **Agreement Gate**: outlines are rendered only if the SAM mask has IoU $\ge 0.5$ with the model box, encloses the click point, and occupies $\le 25\%$ of screen area. Otherwise, the clean model box is shown as a safe fallback.
   - Human rating of outline quality is not run (section 5), so outline quality versus boxes is unmeasured. On the 100-sample ScreenSpot-v2 SAM ablation, mean IoU was 0.556 for the model box and 0.5145 for agreement-gated SAM (`eval/results/2026-10-29-screenspot-v2-heldout-n100-62ed230b-muse-spark-1.3-minimal-samon-max2560-pvv1-80346d48/report.md`).

---

## 4. How ShowMe Differs

| Feature | ShowMe | Microsoft Copilot Vision | Google Gemini Live | Enterprise DAPs (WalkMe) |
| :--- | :--- | :--- | :--- | :--- |
| **Client-side redaction before upload** | Yes, partial: OCR + regex masks structured data, and a mandatory manual review covers the rest. Only the redacted image is uploaded. | Not documented | Not documented | Not reviewed |
| **Platforms** | Web app; the helper can use any screenshot from iOS, Android, Mac, or Windows | Windows, web (screen share), and Copilot mobile app (camera) per Microsoft support | Android and iPhone/iPad (camera and screen sharing) per Google support | Not reviewed |
| **Shareable expiring guide link** | Yes (7-day expiry, creator delete key) | Not documented | Not documented | Not reviewed |
| **Reports "not visible" and refusals** | Yes, with measured rates (section 5; 76.7% on absent targets at prompt v3, so it still guesses in 23.3% of cases) | Not documented | Not documented | Not reviewed |

*Sources, all as of 2026-11-01: Microsoft, [Using Copilot Vision with Microsoft Copilot](https://support.microsoft.com/en-gb/topic/using-copilot-vision-with-microsoft-copilot-3c67686f-fa97-40f6-8a3e-0e45265d425f) (desktop Windows or web screen share; mobile app camera); Google, [Gemini Apps Help: Talk naturally with Gemini Live, iPhone & iPad](https://support.google.com/gemini/answer/15274899?hl=en&co=GENIE.Platform%3DiOS) (Gemini mobile app on iPhone/iPad, with camera and screen sharing). "Not documented" means we did not find it in those pages, not that the product lacks it. Tech help statistics: Journal of Applied Gerontology (2025, n=1,173).*


---

## 5. Measured Evaluation & Honesty

We publish all evaluation numbers directly from raw output files in our open-source repo:

- **ScreenSpot-v2 Benchmark (Held-out, n=1,172, prompt v3)**: **89.9%** click accuracy (prompt v1: 90.7%).
- **ScreenSpot-Pro Benchmark (Held-out high-res apps, n=300, prompt v3)**: **62.0%** click accuracy (`muse-spark-1.3`; prompt v1: 63.7% Spark, 66.7% Wonder).
- **Negatives & Honesty Suite (Held-out absent probes, n=210, prompt v3)**: **76.7%** correctly identified targets as `not_visible` (161 / 210; prompt v1: 62.4%).
- **Safety Refusals (Safety probe suite, n=12, prompt v3)**: **100.0%** refused requests attempting credential harvesting or unsafe actions.
- **20-Task End-to-End Live Web Suite**: the generated run records **70.0% (14/20)** on real live websites (BBC, NHS, Gov.uk, Netflix, Apple, IKEA), average 3.7 steps. An audit of the saved trails found 4 of those 14 passes are suspect (the success check matched a video title, search suggestions or a sign-in page before the task was done), which leaves 10 recorded passes still awaiting validation (14 − 4); this is not a verified 50% success rate. The checks are fixed and covered by offline tests; a re-run is pending, and the generated files are not hand-edited.
- **SAM Highlight Quality (74 live steps)**: Automated pipeline recorded 53 SAM outlines (71.6%), 9 model boxes (12.2%), and 12 no-highlight/scroll states (16.2%); human grading is **not run** (all 74 rating cells in `eval/e2e/highlight_ratings.csv` are empty), so no claim is made that outlines beat boxes.

---

## 6. Video Demo Script Summary (3:00, per participant guide)

- **0:00 - 0:20**: The Problem. Priya receives a WhatsApp screenshot from her 77-year-old father Ken, stuck cancelling a subscription (made-up billing screen, no real data).
- **0:20 - 0:55**: Redaction & Privacy. Priya drops it into ShowMe. On-device OCR masks emails and card numbers; she brushes out a name the patterns missed. The raw image is never uploaded to ShowMe or Meta (Ken had already sent it to her over WhatsApp).
- **0:55 - 1:25**: Step Grounding & Refine. `muse-spark-1.3` draws its box; `sam-3.1` replaces it with an outline only when the agreement gate passes. One sentence: what to tap and where.
- **1:25 - 1:55**: Ken's Experience. Ken opens the 7-day link on his phone, follows the numbered path, and taps the same button in his real app — the picture itself does nothing. He sends the next screenshot for step two.
- **1:55 - 2:20**: Honest limits. Competitors (Copilot Vision, Gemini Live) see the live screen; ShowMe redacts first and publishes its miss: it says "not visible" on 76.7% of absent targets (prompt v3, section 5) — and still highlights something in the other 23.3%.
- **2:20 - 2:45**: Built during the hackathon (26 Oct - 4 Nov). Code on screen: only `redact()` can build a `RedactedImage`; the SAM gate refuses a mask that does not contain Spark's point.
- **2:45 - 3:00**: Live URL, public repo, solo builder, Indie track, Build for Your World. Captions on, no music over the UI.

