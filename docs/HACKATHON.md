# HACKATHON.md - Meta Global AI Developer Hackathon

> Event parameters, judging criteria, project alignment, and architecture rationale for ShowMe.
> Sections marked "official" are quoted from the public event page (checked 2026-11-01). Everything else is our strategy, a plan, or a pointer to a generated file. Numbers come only from `eval/results/` or are labelled target, planned, or not measured (docs/RULES.md).

---

## 1. Event Overview & Key Dates

- **Host**: Meta & Cerebral Valley ([Event Details](https://cerebralvalley.ai/e/meta-ai-developer-hackathon))
- **Submission Portal**: [`https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit`](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/hackathon/submit)
- **Track**: **Indie Developer Track** (Decision D14). The public page describes it as for individual builders and students; the team-size limit of 4 is from the participant briefing and is not on the public page.
- **Theme**: **Build for Your World** (*"Bring Meta's models into your domain. Solve a problem you know firsthand, free up time and mental space, and make something possible that wasn't before."*).
- **Total prize pool (official)**: "$1,000,000 in total prizes" per the event page. The public page lists no per-track or per-place amounts.
  - Per-place amounts and bonus prizes: per participant briefing, unverified publicly. Do not quote them externally.

### Timeline
Source: public event page, times in ET, "dates may change at Meta's discretion". The Official Rules were to be published on Oct 26, 2026; we have not located them, so check them before submitting. Our internal freeze row is ours, not the host's.

| Milestone | Date & Time | Notes |
| :--- | :--- | :--- |
| **Hackathon Start** | Oct 26, 2026 | Kickoff livestream (event page) |
| **Internal Feature Freeze** | Mon Nov 2, 2026, 23:59 London | Our own plan, not a host date |
| **Project Submissions Due** | **Wed Nov 4, 2026, 9:00 PM ET** (Nov 5, 02:00 UTC) | Event page; confirm in the Official Rules |
| **Judging Period** | Nov 4 – Nov 8, 2026 | Event page |
| **Closing Ceremony & Winners** | Nov 9, 2026 | Event page: live finals and winners announced |

---

## 2. Judging Criteria & Winning Strategy

**Official (public event page, https://cerebralvalley.ai/e/meta-ai-developer-hackathon, as of 2026-11-01):** the Indie developer track is "Judged on creativity, technical ambition, and whether it works." The page publishes no numeric weights and no further sub-criteria.

**Our working assumption (not from official rules):** we plan against four lenses taken from the participant briefing, with weights we could not verify publicly: Impact 30%, Demo 25%, Use of Meta tooling 25%, Technical depth 20%. Treat the weights as a prioritisation aid only. The "Official Standard" lines below are paraphrases from that briefing, not quotes from a public source.

Mapping of the official wording to our lenses (strategy): "creativity" is Impact and Meta tooling, "technical ambition" is Meta tooling and Technical depth, "whether it works" is Demo.

### Criterion 1: Impact (assumed 30%)
* **Briefing standard (unverified publicly)**: Real-world potential of the project, who benefits, how much it matters, whether it could become something people use, and whether it fits one of the problem statements.
* **Our alignment (strategy)**:
  * **The Problem (our framing, no market-size claim)**: Older adults and non-technical family members often get stuck on websites and apps, and helpers receive screenshots asking things like *"How do I cancel this gym membership?"*. Common workarounds are a phone call or screen-sharing, which can expose passwords, cards, and bank details. We have not measured how often or how long this takes.
  * **Who Benefits**: The **Remote Helper** (Priya) and the **Stuck Relative** (Ken, 77). Priya drops the screenshot into ShowMe, verifies the on-device PII redaction, gets the exact button highlighted with Meta AI, and shares a 7-day self-destructing guide link back to Ken. Ken opens the link on his iPhone and follows the highlighter ring. Time to finish is not measured; usability sessions are planned (`eval/usability/2026-11-01-kit.md`) and no results exist yet.
  * **Theme Fit**: Our argument for fit with the theme **Build for Your World**: it targets a problem the team knows from family experience. Whether judges agree is not something we can state.

### Criterion 2: Demo & Video (assumed 25%)
* **Briefing standard (unverified publicly)**: Working, impressive demo, whether the product holds up live, and the quality of the demo video.
* **Our alignment (strategy)**:
  * **Live Production App**: Deployed at [https://showme-web-delta.vercel.app](https://showme-web-delta.vercel.app) (API health endpoint: [healthz](https://showme-api-xi.vercel.app/v1/healthz)). Uptime and health-check latency are not measured or monitored; no uptime figure is claimed.
  * **One-Tap Judge Demo**: Built-in *"Try with an example billing screenshot"* button on `/app` allows judges to test the complete end-to-end pipeline in one tap without finding a screenshot.
  * **Mobile layout checks**: `scripts/live_iphone16_audit.mjs` runs automated iPhone 16 layout checks (overflow, 44px touch targets, docked step card). Its output is not stored in `eval/results/`, so no pass count is claimed here; re-run it and cite the output before quoting a number.
  * **Demo Video (planned, not recorded)**: target 2 minutes following the Priya + Ken story (`docs/DESIGN.md §7`). Recording, devices used, and voiceover are not done yet.

### Criterion 3: Use of Meta AI Tooling (assumed 25%)
* **Briefing standard (unverified publicly)**: How creatively the team used Meta's AI tooling, whether they went beyond a basic integration, and whether they surfaced unexpected capabilities.
* **Our alignment (strategy)**:
  * **Multi-Stage Visual Pipeline**: We do not build a basic text chatbot. ShowMe chains two distinct Meta models:
    1. **`muse-spark-1.3`**: Grounded visual comprehension via Meta API, outputting normalized coordinates (0–1000 grid), action classification (`tap`, `type`, `scroll`), and concise instructions under strict JSON schema enforcement (`additionalProperties: false`).
    2. **`sam-3.1` (Segment Anything Model)**: Promoted with the model bounding box to compute pixel-perfect SVG contour outlines for irregular controls, icons, and buttons.
  * **Agreement Gate**: An algorithmic guardrail ensuring SAM outlines are only displayed when SAM agrees with Spark's box (IoU $\ge 0.5$, point enclosed, area $\le 25\%$; ARCHITECTURE §5). If not, it falls back to the clean box without moving the click point.
  * **Negative & Safety Probing**: Prompts and postprocessors are designed to return `not_visible` when a requested button is absent and `refuse` when unsafe, instead of inventing coordinates. Measured results are in Criterion 4. SAM outline quality has not been human graded (not run; D44).

### Criterion 4: Technical Depth & Execution (assumed 20%)
* **Briefing standard (unverified publicly)**: Sound engineering, thoughtful refinement, and demonstrating real craft.
* **Our alignment (strategy)**:
  * **Architecture Integrity**: Clean monorepo (`apps/web` Next.js 14 strict TypeScript, `backend` FastAPI Python 3.11 with pure functional core in `showme/core`, `eval` offline benchmark harnesses).
  * **Testing & Quality Gates**: unit tests (backend, eval, web), Playwright browser tests including axe checks, and `scripts/score_gate.py`. Test counts and the score-gate result are not stored in `eval/results/`; run `make test` and the gates and quote that output rather than a number written here.
  * **Privacy engineering (design goals; rules in RULES.md P1-P9)**:
    * Zero raw screenshot transmission: Only client-side WASM OCR redacted bitmaps (`RedactedImage`) ever reach the network.
    * Ephemeral storage: Backend never logs or stores images, goals, or raw IPs. Opt-in shared guides expire after 7 days (checked on every read). Purge job behaviour is by design; check ARCHITECTURE before claiming more.
    * Creator delete key: SHA-256 hashed secrets allow instant guide revocation.
  * **Evaluation (generated files in `eval/results/`, see `RESULTS.md`)**:
    * ScreenSpot-v2 held-out, n=1172, `muse-spark-1.3` minimal, SAM off: 90.7% (`2026-10-29-screenspot-v2-heldout-n1172-...`).
    * ScreenSpot-Pro held-out, n=300, same config: 63.7%. `muse-wonder-1.0` on the same 300: 66.7%.
    * Negatives held-out, n=222: 64.4% overall (143/222). Absent-target (`not_visible` expected) 131/210 = 62.4%. Refusal (`refuse` expected) 12/12, a small sample that includes synthetic cases, so it is not evidence of general safety.
    * Live E2E, 20 web tasks: the recorded run reports 14/20 passes, average 3.7 steps (`eval/results/2026-11-01-e2e-final/report.md`). 4 of those passes are suspect and the other 10 are recorded passes awaiting validation; this is not a verified success rate (MEMORY D48).

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
- **Speed & Latency**: Interactive guidance requires fast feedback. Spark at `minimal` effort had p50 2,809 ms in the 10-sample spike (SPIKES.md; run-to-run variance seen, n=10). Higher efforts were slower in the same spike (low 4,282 ms, default 5,485 ms). Wonder at minimal was 3,069 ms in that spike, so Wonder is not 5-8 s there. Production latency over real traffic is not measured.
- **Cost Efficiency**: about $0.0051 per grounding call at minimal effort (arithmetic on token usage, SPIKES.md; Wonder about $0.0157). Spend is capped by a budget ceiling (RULES, `eval/results/spend.json`).
- **Accuracy**: 90.7% on ScreenSpot-v2 held-out (n=1172). We did not run Wonder on ScreenSpot-v2. On ScreenSpot-Pro (n=300) Wonder scored higher (66.7% vs 63.7%), so we do not claim Spark matches or beats larger models.

### Why `sam-3.1` via Meta Model API?
- **Pixel Contour Highlights**: Rectangular boxes look clunky over circular profile icons, pill-shaped buttons, or hamburger menus. SAM segments the exact organic contour.
- **Box Prompting**: The SAM spike measured higher IoU when prompting with the model box (0.51) than with a point (0.41); small spike sample, see SPIKES.md.

### Why the Agreement Gate?
- **Safety First**: SAM is class-agnostic and can segment whatever lies near the prompt even if Spark picked the wrong element (spike: refinement did not fix wrong clicks). The Agreement Gate requires IoU $\ge 0.5$ and enclosure of the click point before displaying an outline. Otherwise, ShowMe falls back safely to Spark's bounding box.

### Why Client-Side Redaction (Tesseract WASM)?
- **Privacy Guarantee (PRIV-1)**: Uploading unredacted screenshots to third-party APIs or backend servers exposes personal data (bank details, passwords, health info). Running redaction client-side in a Web Worker is designed so that unredacted pixels never reach the network (only `RedactedImage` is sent). Redaction recall is not guaranteed: OCR can miss text, which is why review is mandatory.

---

## 5. Verification & Submission Checklist for Agents

Before committing or pushing any change, every agent must verify:

1. **Ponytail Rule**: Run `git diff HEAD`, delete speculative features or dead code, condense boilerplate, and ensure diff is lean.
2. **Quality Gates**:
   - `make lint`: Zero ESLint, TypeScript, Ruff, or Mypy errors.
   - `make test`: all unit tests pass.
   - `pnpm --filter web test:e2e`: all Playwright browser tests pass.
   - `python3 scripts/score_gate.py day7`: passes.
   - `node scripts/live_iphone16_audit.mjs http://localhost:3000`: all checks pass.
   - Paste the real command output in the commit or session notes; counts are not hard-coded here.
3. **Evidence Integrity**: Never fake a benchmark result or claim human evaluation unless personally conducted. Publish only numbers from generated files in `eval/results/`.
4. **Git Identity**: Commits must strictly be authored by `jeevesh2515` (`jeevesh2515@gmail.com`) with no co-author trailers.
