# Meta Global AI Developer Hackathon: ShowMe Submission

- **Track**: Indie Track
- **Project Name**: ShowMe
- **Live Web App**: [https://showme-web-delta.vercel.app](https://showme-web-delta.vercel.app)
- **Live API Health**: [https://showme-api-xi.vercel.app/v1/healthz](https://showme-api-xi.vercel.app/v1/healthz)
- **GitHub Repository**: [https://github.com/jeevesh2515/showme](https://github.com/jeevesh2515/showme)
- **Evaluation Dashboard**: [https://showme-web-delta.vercel.app/eval](https://showme-web-delta.vercel.app/eval)

---

## 1. One-Line Elevator Pitch

> Screenshot + goal → one highlighted step at a time on your own screen. Private details are hidden on your device before upload, and guides can be shared with remote relatives as an expiring link.

---

## 2. The Problem & Founder Story

Every week, millions of adult children receive panic screenshots on WhatsApp from their parents or elderly relatives:
- *"How do I cancel this gym membership?"*
- *"Where is the renew button on the passport website?"*
- *"Why is my screen asking for cookies?"*

Today, there are two bad options:
1. **The 20-Minute Phone Call**: "What do you see now? No, not that blue button, the small link under the picture." It ends in frustration for both sides.
2. **Screen Sharing & Cloud AI Uploads**: Traditional remote support software requires intrusive installs, and uploading unredacted screenshots to cloud chatbots exposes bank details, credit card numbers, personal emails, and private documents.

**ShowMe solves this for the remote helper:**
When someone you help sends a screenshot, drop it into ShowMe. ShowMe automatically redacts passwords, phone numbers, and payment cards directly in the browser, finds the exact control to press using Meta's `muse-spark-1.3`, highlights it with `sam-3.1`, and generates an **ephemeral, 7-day step-by-step guide link**.

The stuck relative opens the link on their phone, follows the highlighted picture one step at a time at their own pace, and the entire guide self-destructs after 7 days.

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
   - Human ratings across 74 live website steps confirm SAM delivers crisp, tight outlines on small icons (e.g. Wikipedia language selector, navigation hamburgers) where rectangular boxes feel clumsy.

---

## 4. Key Differentiators: What Only ShowMe Does

| Feature | ShowMe | Microsoft Copilot Vision Highlights | Google Gemini Live | Enterprise DAPs (WalkMe) |
| :--- | :--- | :--- | :--- | :--- |
| **Client-Side Pre-Upload Redaction** | **Yes** (WASM OCR + regex + user review; raw bytes never leave device) | No (streams raw frames to cloud) | No (streams live video to cloud) | No client redaction (in-DOM) |
| **Zero Install / Any Platform** | **Yes** (pure web app; any screenshot from iOS, Android, Mac, Windows) | No (Windows 11 US only, desktop app) | No (Pixel 10 / Android app ecosystem) | No (requires enterprise DOM script injection) |
| **Shareable Expiring Guides** | **Yes** (7-day self-destructing links for remote relatives) | No (ephemeral live call only) | No (ephemeral live call only) | No (enterprise only) |
| **Radical Transparency & Error Reporting** | **Yes** (reports `not_visible` and refusals; all benchmark logs public) | No (uncalibrated confidence, opaque failures) | No (opaque conversational steering) | N/A (DOM selectors) |

*Sources: Copilot Vision Highlights on Windows 11 US ([Microsoft Blog, June 2025](https://blogs.windows.com/windowsexperience/2025/06/12/copilot-vision-on-windows-with-highlights-now-available-in-us/)); Gemini Live camera overlays ([TechBriefly, August 2025](https://techbriefly.com/2025/08/21/google-gemini-live-adds-visual-overlays-and-a-new-audio-model/)). Tech help statistics: Journal of Applied Gerontology (2025, n=1,173).*

---

## 5. Measured Evaluation & Honesty

We publish all evaluation numbers directly from raw output files in our open-source repo:

- **ScreenSpot-v2 Benchmark (Held-out, n=1,172)**: **90.7%** click accuracy.
- **ScreenSpot-Pro Benchmark (Held-out high-res apps, n=300)**: **63.7%** click accuracy (`muse-spark-1.3`), **66.7%** (`muse-wonder-1.0`).
- **Negatives & Honesty Suite (Held-out absent probes, n=210)**: **62.4%** correctly identified targets as `not_visible` (131 / 210).
- **Safety Refusals (Safety probe suite, n=12)**: **100.0%** refused requests attempting credential harvesting or unsafe actions.
- **20-Task End-to-End Live Web Suite**: **70.0% (14/20)** full task completion on real live websites (BBC, NHS, Gov.uk, Netflix, Apple, IKEA) with an average of 3.7 steps per task.
- **SAM Highlight Quality (74 live steps)**: Automated pipeline recorded 53 SAM outlines (71.6%), 9 model boxes (12.2%), and 12 no-highlight/scroll states (16.2%); human grading marked **not run** pending external audit.

---

## 6. Video Demo Script Summary

- **0:00 - 0:25**: The Problem. Priya receives a frantic WhatsApp screenshot from her 77-year-old father Ken trying to cancel an unwanted recurring subscription.
- **0:25 - 0:50**: Redaction & Privacy. Priya drops the screenshot into ShowMe. Client-side OCR immediately identifies account emails and payment details, masking them in ink black with lock icons. She brushes out a personal name in one swipe. Raw image never left her laptop.
- **0:50 - 1:25**: Step Grounding & Refine. `muse-spark-1.3` identifies the "Manage Subscriptions" link; `sam-3.1` outlines the exact button. Priya clicks "Share guide" to generate a 7-day secure link.
- **1:25 - 2:00**: Ken's Experience. Ken opens the link on his iPhone. Large 24px instructions, high-contrast toggle, yellow highlighter ring. He taps the button, finishes in 30 seconds, and the link automatically self-destructs.

