# HACKATHON.md — Meta Global AI Developer Hackathon

> Official event parameters, judging criteria, project alignment, and architecture rationale for ShowMe.
> Reference this document to understand **what** we are building, **why** these tools and models were chosen, and **how** every architectural decision ties directly to winning the hackathon.

---

## 1. Event Overview & Key Dates

- **Host**: Meta & Cerebral Valley ([Event Details](https://cerebralvalley.ai/e/meta-ai-developer-hackathon))
- **Submission Portal**: [`https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit`](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit)
- **Track**: **Indie Developer Track** (Decision D14; teams up to 4 / individual builders).
- **Theme**: **Build for Your World** (*"Bring Meta's models into your domain. Solve a problem you know firsthand, free up time and mental space, and make something possible that wasn't before."*).
- **Total Cash Prize Pool**: **$1,000,000 USD** (funded by Meta, distributed via Cerebral Valley / Tremendous).
  - **Indie Developer Track ($400,000 total)**:
    - 1st Prize: $150,000
    - 2nd Prize: $100,000
    - 3rd Prize: $75,000
    - 4th Prize: $50,000
    - 5th Prize: $25,000
  - **Bonus Prizes ($50,000 aggregate)**: Community vote, most viral project, notable technical achievements.

### Official Timeline
| Milestone | Official Date & Time | Notes |
| :--- | :--- | :--- |
| **Hackathon Start** | Oct 26, 2026 | Kickoff livestream |
| **Internal Feature Freeze** | Mon Nov 2, 2026, 23:59 London | Code locked; polish & docs only |
| **Project Submissions Due** | **Wed Nov 4, 2026, 9:00 PM ET** (Nov 5, 02:00 UTC) | Hard deadline on Cerebral Valley portal |
| **Judging Period** | Nov 4 – Nov 8, 2026 | Evaluated across 4 criteria |
| **Closing Ceremony & Winners** | Nov 9, 2026 | Live finals and winner announcements |

---

## 2. Official Judging Criteria & Winning Strategy

Every project submission is evaluated against 4 criteria with explicit weights:

```
┌─────────────────────────────────────────────────────────────────────────┐
│               OFFICIAL HACKATHON JUDGING CRITERIA (100%)                │
├───────────────────┬───────────────────┬────────────────┬────────────────┤
│    Impact (30%)   │     Demo (25%)    │ Meta Tools(25%)│ Tech Depth(20%)│
└───────────────────┴───────────────────┴────────────────┴────────────────┘
```

### Criterion 1: Impact (30%)
* **Official Standard**: Real-world potential of the project, who benefits, how much it matters, whether it could become something people use, and whether it fits one of the problem statements.
* **Our Alignment**:
  * **The Problem**: Over 100M older adults and non-technical family members get stuck navigating websites and mobile apps. Every week, adult children receive panicked WhatsApp screenshots (*"How do I cancel this gym membership?"*, *"Where do I renew my passport?"*). The current solutions are a painful 20-minute phone call or risky screen-sharing that exposes passwords, credit cards, and bank details.
  * **Who Benefits**: The **Remote Helper** (Priya) and the **Stuck Relative** (Ken, 77). Priya drops the screenshot into ShowMe, verifies the on-device PII redaction, gets the exact button highlighted with Meta AI, and shares a 7-day self-destructing guide link back to Ken. Ken opens the link on his iPhone, follows the highlighter ring, and finishes in 30 seconds.
  * **Theme Fit**: Perfectly embodies **Build for Your World**—grounded in personal family experience, liberating mental bandwidth and empowering digital inclusion.

### Criterion 2: Demo & Video (25%)
* **Official Standard**: Working, impressive demo, whether the product holds up live, and the quality of the demo video.
* **Our Alignment**:
  * **Live Production App**: Deployed at [https://showme-web-delta.vercel.app](https://showme-web-delta.vercel.app) with 100% uptime and sub-second health checks ([API Health](https://showme-api-xi.vercel.app/v1/healthz)).
  * **One-Tap Judge Demo**: Built-in *"Try with an example billing screenshot"* button on `/app` allows judges to test the complete end-to-end pipeline in one tap without finding a screenshot.
  * **Verified Mobile Experience**: 35 / 35 automated iPhone 16 layout checks pass (`scripts/live_iphone16_audit.mjs`), ensuring zero overflow, 44px touch targets, and docked step cards.
  * **Paced Demo Video**: 2-minute video following the Priya + Ken story (`docs/DESIGN.md §7`), recorded on real devices with clear voiceover and high visual contrast.

### Criterion 3: Use of Meta AI Tooling (25%)
* **Official Standard**: How creatively the team used Meta's AI tooling, whether they went beyond a basic integration, and whether they surfaced unexpected capabilities.
* **Our Alignment**:
  * **Multi-Stage Visual Pipeline**: We do not build a basic text chatbot. ShowMe chains two distinct Meta models:
    1. **`muse-spark-1.3`**: Grounded visual comprehension via Meta API, outputting normalized coordinates (0–1000 grid), action classification (`tap`, `type`, `scroll`), and concise instructions under strict JSON schema enforcement (`additionalProperties: false`).
    2. **`sam-3.1` (Segment Anything Model)**: Promoted with the model bounding box to compute pixel-perfect SVG contour outlines for irregular controls, icons, and buttons.
  * **Agreement Gate**: An algorithmic guardrail ensuring SAM outlines are only displayed when SAM agrees with Spark's box (IoU $\ge 0.5$, point enclosed, area $\le 25\%$). If not, it falls back to the clean box without moving the click point.
  * **Negative & Safety Probing**: Specialized prompts and postprocessors detect when a requested button is absent (`not_visible`) or unsafe (`refuse`), surfacing honest errors rather than hallucinating coordinates.

### Criterion 4: Technical Depth & Execution (20%)
* **Official Standard**: Sound engineering, thoughtful refinement, and demonstrating real craft.
* **Our Alignment**:
  * **Architecture Integrity**: Clean monorepo (`apps/web` Next.js 14 strict TypeScript, `backend` FastAPI Python 3.11 with pure functional core in `showme/core`, `eval` offline benchmark harnesses).
  * **Testing & Quality Gates**: 267 unit tests (156 backend, 31 eval, 80 web), 52 Playwright E2E browser tests (0 axe accessibility violations), and automated Score Gate (10.0 / 10).
  * **Radical Privacy Engineering**:
    * Zero raw screenshot transmission: Only client-side WASM OCR redacted bitmaps (`RedactedImage`) ever reach the network.
    * Ephemeral storage: Backend never logs or stores images, goals, or raw IPs. Opt-in shared guides expire after 7 days and are purged daily from private Supabase storage.
    * Creator delete key: SHA-256 hashed secrets allow instant guide revocation.
  * **Scientific Evaluation**: Published results on ScreenSpot-v2 (90.7%), ScreenSpot-Pro (63.7%), Negatives suite (62.4% absent-target honesty, 100% safety refusal), and 20 live web tasks (14/20 completion, avg 3.7 steps).

---

## 3. What We Are Building: Feature Breakdown

```
┌────────────────────────────────────────────────────────────────────────┐
│                          SHOWME APPLICATION FLOW                       │
├─────────────────┬──────────────────┬─────────────────┬─────────────────┤
│ 1. Start Screen │ 2. Review Screen │ 3. Step Guidance│  4. Share Guide │
│                 │                  │                 │                 │
│ • Goal input    │ • Auto-PII mask  │ • Ring overlay  │ • 7-day link    │
│ • Drag/paste    │ • Brush tool     │ • SAM contour   │ • Consent check │
│ • Example sample│ • Tap-to-hide    │ • Docked card   │ • Delete secret │
│ • Device help   │ • Lock glyphs    │ • Audio read    │ • Expired purge │
└─────────────────┴──────────────────┴─────────────────┴─────────────────┘
```

1. **Start Screen (`/app`)**:
   - Accepts goal text (max 300 chars) and screenshot via drag-and-drop, clipboard paste, or file selection.
   - Includes *"Try with an example billing screenshot"* for instant judge walkthroughs.
2. **Privacy Review Screen (`/app` review phase)**:
   - Mandatory on-device OCR runs inside a Web Worker using self-hosted Tesseract WASM.
   - Auto-masks emails, phone numbers, card numbers, UK postcodes, and IBANs with solid ink blocks and highlighter lock glyphs.
   - Interactive manual brush tool (finger/mouse drag) and tap-to-hide (22px near-tap radius for phone usability).
   - "Looks private. Continue" button enables only after user review.
3. **Step Guidance Screen (`/app` step phase)**:
   - Shows the annotated screenshot with a highlighter yellow bounding ring and numbered badge.
   - Crossfades smoothly from the rectangular box to the SAM 3.1 outline once refined.
   - Docked bottom card on mobile with step count, clear action instruction, and caution banner (e.g. *"Careful: cancelling ends your plan"*).
   - Keyboard shortcuts (`N` for next, `R` for read aloud, `Esc` to cancel) and Web Speech API synthesis.
4. **Early & Late Share Flow (`/g/[token]`)**:
   - Helpers can generate a guide link from Step 1 (`data-testid="share-early-btn"`) or at completion.
   - Requires explicit second review and consent checkbox.
   - Generates an expiring 7-day link with an immediate deletion key.
   - Recipients view the step card and annotated screenshot with large touch targets and high-contrast toggle.

---

## 4. Why We Chose These Models & Tools

### Why `muse-spark-1.3` (with `reasoning_effort=minimal`)?
- **Speed & Latency**: Interactive guidance requires fast feedback. Spark at `minimal` effort responds in ~1.3 s (total p50 ~2.0 s including network), compared to 5–8 s for Wonder or higher reasoning efforts.
- **Cost Efficiency**: $0.0051 per grounding call allows free public use and high-volume multi-step tasks without exhausting the hackathon budget.
- **Accuracy**: Delivers **90.7%** click accuracy on ScreenSpot-v2 held-out benchmarks, matching or exceeding larger models on standard UI elements.

### Why `sam-3.1` via Meta Model API?
- **Pixel Contour Highlights**: Rectangular boxes look clunky over circular profile icons, pill-shaped buttons, or hamburger menus. SAM segments the exact organic contour.
- **Box Prompting**: Spikes revealed that prompting SAM with Spark's proposed bounding box yields higher IoU (0.51) than single-point prompting (0.41).

### Why the Agreement Gate?
- **Safety First**: SAM is a class-agnostic segmentation model; it segments whatever lies near the prompt even if Spark picked the wrong element. The Agreement Gate requires IoU $\ge 0.5$ and enclosure of the click point before displaying an outline. Otherwise, ShowMe falls back safely to Spark's bounding box.

### Why Client-Side Redaction (Tesseract WASM)?
- **Privacy Guarantee (PRIV-1)**: Uploading unredacted screenshots to third-party APIs or backend servers exposes personal data (bank details, passwords, health info). Running redaction client-side in a Web Worker guarantees that unredacted pixels never touch the network.

---

## 5. Verification & Submission Checklist for Agents

Before committing or pushing any change, every agent must verify:

1. **Ponytail Rule**: Run `git diff HEAD`, delete speculative features or dead code, condense boilerplate, and ensure diff is lean.
2. **Quality Gates**:
   - `make lint`: Zero ESLint, TypeScript, Ruff, or Mypy errors.
   - `make test`: All 267 unit tests passing (156 backend, 31 eval, 80 web).
   - `pnpm --filter web test:e2e`: All 52 Playwright browser tests passing (0 axe violations).
   - `python3 scripts/score_gate.py day7`: Score 10.0 / 10 PASS.
   - `node scripts/live_iphone16_audit.mjs http://localhost:3000`: All 35 checks PASS.
3. **Evidence Integrity**: Never fake a benchmark result or claim human evaluation unless personally conducted. Publish only verified generated numbers.
4. **Git Identity**: Commits must strictly be authored by `jeevesh2515` (`jeevesh2515@gmail.com`) with no co-author trailers.
