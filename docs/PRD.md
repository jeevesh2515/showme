# PRD: ShowMe

Status: approved 2026-10-27 (MEMORY D14) · Owner: founder · Last updated: 2026-10-27
Track: Indie (founder decision D14; judged on creativity, technical ambition, and whether it works per the official hackathon page, D17; submission format still Q4)
Related: [REQUIREMENTS.md](REQUIREMENTS.md) (testable requirements), [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), [PHASES.md](PHASES.md), evidence in [SPIKES.md](SPIKES.md).

## 1. One line

ShowMe turns a screenshot and a goal ("cancel my subscription") into step-by-step visual instructions drawn on the user's own screen, without the raw screenshot ever leaving their device.

## 2. Problem

Apps and websites hide important actions (cancel, change a setting, find a form) behind menus that differ per product and change often. People who get stuck have three bad options today:

- **Ask a relative.** The relative is often remote, so they get a phone call or a blurry photo and try to explain "the three dots, top right, no, the other one". Slow for both sides.
- **Search for a help article.** Articles are generic, often out of date, and written for a different device or version. The user has to translate text into "where on my screen".
- **Ask a general chatbot.** It answers in text, guesses at UI it cannot see, and asks for a screenshot that then carries the user's email, card digits and account details to a third party.

The underlying gap: help is not **grounded in the user's actual screen**, and the tools that could see the screen are not **private by default**.

## 3. Users

| Persona | Situation | What they need from ShowMe |
| --- | --- | --- |
| **Primary: the stuck user.** Often older or less tech-confident. Example: Ken, 77, wants to stop a streaming subscription he no longer uses. | One device, one goal, low patience for jargon, worried about scams and "pressing the wrong thing". | One instruction at a time, in plain words, with a big obvious highlight. Honesty when ShowMe is not sure. Reassurance that nothing private is sent. |
| **Secondary: the helper relative.** Example: Priya, Ken's daughter, two hours away. | Gets the call. Wants to fix it once and not again next month. | A shareable guide she can make once and send, which expires on its own. |
| **Future buyer: support lead at a consumer company** (hypothesis, see §8). | Ticket volume from "how do I…" questions. | A widget that guides users on their own screen and deflects tickets. |

Out of scope users for the hackathon: enterprise IT admins, screen-reader-only users needing full non-visual navigation (we support screen readers for our own UI; describing arbitrary third-party UIs non-visually is a different product).

## 4. Product principles

1. **Private by construction, not by policy.** Redaction runs in the browser before upload. The server has no code path that accepts an unredacted image (REQUIREMENTS PRIV-1).
2. **One step at a time.** One action, one highlight, one sentence. Never a wall of text.
3. **Honest over clever.** If the target is not visible or the model is unsure, ShowMe says so and suggests what to do (scroll, go back, open a menu). It never guesses silently.
4. **Earn trust with numbers.** Public, reproducible eval results, including the ones that look bad.
5. **No account needed** for the core flow.

## 5. Scope

### 5.1 MVP (must ship by feature freeze, Nov 2 23:59 London)

1. Upload, paste (Ctrl/Cmd+V) or drag a screenshot; type a goal.
2. In-browser redaction: OCR + regex auto-hide with solid blocks (emails, phone numbers and card numbers are tested in the spike; UK postcodes, IBANs and long digit runs are added in the MVP and tested on Day 3), mandatory review screen with a brush and tap-to-hide text line. Raw image never uploaded.
3. Guided step: Muse Spark 1.3 returns a structured step (action, target, one-sentence instruction, status, caution). Shown as a numbered highlight overlay plus the sentence, read aloud on request.
4. Precise outline: SAM 3.1 outline replaces the box when it agrees with the model's box (progressive: box first, outline when ready).
5. Honest states: `not_visible` (with scroll or navigation hint), `unsure` (shows best guess clearly marked "check this"), `done`, `refuse` (unsafe goal).
6. Loop: "I did it, next screenshot" until done; history kept in the browser tab only.
7. Caution notes on risky steps (payments, sharing codes, remote-access apps, gift cards).
8. Opt-in "Share guide": stores only redacted step images and text behind an unguessable link, deleted after 7 days; creator gets a delete link.
9. Accessibility: large text by default, high-contrast mode, full keyboard use, screen-reader announcements, reduced motion.
10. Rate limiting and a global spend cap so the public demo cannot exhaust the API credit.
11. Landing page with live eval numbers, privacy promise and demo video.
12. Eval harness: ScreenSpot-v2 (full), ScreenSpot-Pro (stratified 300), absent-target set, 20-task end-to-end suite; one command; markdown results in repo.

### 5.2 Stretch (only after MVP DoD is green; in this order)

1. Spoken goal via Muse Voice Transcribe (typed input is always available).
2. Muse Wonder escalation on `unsure` steps ("try harder" button).
3. Crop-and-re-ground pass for tiny targets on large screens.
4. Pixel detection of input fields for automatic free-text redaction.
5. Additional OCR languages for redaction (loaded on demand).
6. Embeddable widget demo page ("ShowMe for your help centre"), static, no backend changes.

### 5.3 Explicitly cut (will not be built during the hackathon)

- Browser extension or desktop app that captures the screen automatically (privacy and review burden; screenshots keep the user in control).
- Live screen sharing, video or continuous capture.
- Taking actions for the user (clicking, typing). ShowMe guides; the user acts. This keeps liability and prompt-injection impact low.
- Accounts, login, payment, saved history.
- Native mobile apps (the web app works on mobile browsers).
- Self-hosting open-weights models (the API covers every need; see SPIKES.md).

## 6. Success criteria

### 6.1 Product (measured by the eval harness and the E2E suite; targets are goals, results are reported whatever they are)

| Metric | Target | How measured |
| --- | --- | --- |
| Click accuracy, ScreenSpot-v2 (full; ~1,272, count confirmed on download) | ≥ 85% | `make eval SUITE=screenspot-v2` |
| Click accuracy, ScreenSpot-Pro (stratified 300) | ≥ 40% | `make eval SUITE=screenspot-pro` |
| Absent-target honesty (no highlight when target absent) | ≥ 90% | `make eval SUITE=negatives` |
| E2E task success, 20 public-site tasks | ≥ 70% | `make e2e` |
| Average steps per successful E2E task | report only | `make e2e` |
| Step latency, server side (ground), p50 / p95 | ≤ 3.5 s / ≤ 7 s | eval + production logs |
| Cost per step | ≤ $0.01 | usage tokens × price table |
| Raw image upload incidents | 0 (hard) | automated test PRIV-1 + network assertion in E2E |

### 6.2 Submission

Public URL live by end of Day 4 (Oct 30); demo video 2 to 3 minutes; README with one-command setup and eval reproduction; public repo with CI green.

## 7. Founder narrative

> My job is building AI systems that ground answers in real evidence. At home, I kept getting the same call from family: "it's asking me something, what do I press?" Every tool I tried either explained in words what it could not see, or wanted me to upload a screenshot full of their email and card details. ShowMe is the version I wanted: it looks at your actual screen, points at the one thing to press next, says so when it is not sure, and the private bits never leave your device. I built it on Meta's Muse Spark for grounding and SAM 3.1 for the outline, and I published how often it is right, including where it fails.

(Founder to adjust the personal details so they are true.)

## 8. Business hypothesis (hypothesis, not fact)

**Hypothesis.** The consumer app proves the experience and gathers evidence; the business is **"ShowMe for your help centre"**: an embeddable widget a company adds to its help pages, so customers stuck on that company's product get guided on their own screen instead of opening a ticket.

Why it could work (each item is an assumption to test):
- "How do I…" questions are a large share of consumer support contacts.
- A guided step on the user's own screen resolves more of those than a static article.
- Companies already pay per resolution for AI support tools, so per-step pricing is familiar.

**Pricing hypothesis.**

| Plan | Price | Includes | Unit economics at measured cost |
| --- | --- | --- | --- |
| Consumer | Free | Rate-limited | ~$0.0076 per step (SPIKES.md) |
| Starter widget | £99 / month | 5,000 guided steps, branding, analytics | API cost ~$38 (≈ £30), ~70% gross margin before hosting |
| Growth | £0.03 per step over plan | Overage, custom caution rules | ~5x API cost (~£0.006 per step, from the £30 per 5,000 steps above) |
| Enterprise | Custom | DPA, SSO, data residency, option to run Muse Spark Open on their cloud | n/a |

**Metrics that would validate it.**
- Consumer: task success rate (E2E and live "it worked" taps), 7-day return rate, share-guide rate.
- Widget pilot: ticket deflection (sessions ending `done` with no ticket in 24 h), cost per resolved session vs the company's cost per ticket, CSAT on guided sessions.
- Kill signal: if live success rate stays under 50% or pilot deflection under 10% after iteration, the widget thesis fails.

## 9. Non-goals and constraints

- Budget £0 out of pocket. Meta Model API credit ($150) covers model calls; Vercel and Supabase free tiers cover hosting.
- All code written during the hackathon (Oct 27 to Nov 4). No code copied from previous repos.
- Built on Meta models: Muse Spark 1.3 (grounding), SAM 3.1 (outline), optionally Muse Wonder and Muse Voice Transcribe.
