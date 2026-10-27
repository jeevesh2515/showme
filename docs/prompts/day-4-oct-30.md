You are the founding engineer for ShowMe in /Users/jeeveshsingale/dev/ShowMe. Today is **Day 4, Fri Oct 30, 2026**. Theme: **the core loop works end to end, and it is live on a public URL**. Budget for live API calls today: **$3**.

## Read first
1. `docs/prompts/00-common.md` and its session start protocol (carry-over check against Day 3 DoD; read Day 3's checkpoint decisions in MEMORY.md, they may change today's work).
2. `docs/DESIGN.md` in full (§3 overlay, §4 screens, §4.7 error copy, §8 copy rules).
3. `docs/ARCHITECTURE.md` §3 (two-call flow), §4 (contracts), §7 (redaction), §10 (hosting), §12 (headers).
4. `docs/REQUIREMENTS.md` IDs: FLOW-1 to FLOW-13, PRIV-1, PRIV-2, PRIV-4, API-8, WEB-3.

## Phase 1 · Typed client and start + review screens (morning)
- Generate the TS client from the backend `/openapi.json` into `apps/web/lib/api/`; CI step regenerates and fails on drift (API-8). The client accepts only `RedactedImage` for image fields.
- `/app` Start screen (DESIGN §4.1): goal input, paste anywhere (Ctrl/Cmd+V), drag and drop, file picker, "How do I take a screenshot?" help per device (FLOW-1).
- Privacy check screen (DESIGN §4.2): auto blocks, tap a text line to hide it, brush, undo, zoom, one primary button "Looks private. Continue" (FLOW-3, PRIV-2). No path to the API without passing this screen.
- Load `frontend-design:frontend-design` first; DESIGN.md tokens and copy win.

## Phase 2 · Step view, overlay and states (critical path, you)
- Overlay as an SVG layer with `viewBox` = image size (DESIGN §3): scrim with cut-out, dual-stroke ring, numbered badge that flips to stay on screen, magnifier inset for targets < 32 px.
- Two-call flow: show the box from `/v1/step`, then swap to the SAM outline from `/v1/refine` with a 200 ms crossfade and no layout shift (FLOW-4, FLOW-5). Reduced motion: instant.
- States: `unsure` dashed ring + check-before-you-tap text, `not_visible` edge arrow + hint, `done`, `refuse`, caution banner with icon and the word "Careful" (FLOW-6 to FLOW-10). Error copy from DESIGN §4.7.
- Loop: "I did it, next" keeps goal and text-only history in memory; "That didn't work" sends `result: "failed"` (FLOW-11, FLOW-12). Read aloud with on-device `speechSynthesis` (FLOW-13).
- Progress text while waiting (DESIGN §4.3), with the > 10 s message.
- Subagent T (sonnet, owns `apps/web/tests/`): Playwright specs for FLOW-1 to FLOW-13 using recorded API fixtures, and `priv-1.spec.ts` that inspects every request body and asserts no bytes or hash of the original fixture image appear (PRIV-1), plus PRIV-4 (no step data in cookies or storage after the flow).

## Phase 3 · Deploy (afternoon; do not leave this to the evening)
- Vercel project 1: `apps/web`. Vercel project 2: `backend` as a Python Function (FastAPI). Next.js rewrites `/api/*` to the backend. Env vars set in Vercel (never in code). Founder must have linked the accounts; if not, stop and ask.
- Verify with a real 1920 px JPEG that the request body limit and function duration are fine (assumption A5). If they fail: deploy the same Docker image to Render or Cloud Run today and point the rewrite at it (RISKS R7), record the D-number.
- Security headers from ARCHITECTURE §12 on the web app; check them with `curl -I`.
- **Check:** on the public URL, a real screenshot goes redaction → step → outline; `/v1/healthz` returns 200.

## Phase 4 · Real use-case smoke on the live site (evening)
Run these 5 by hand through the deployed app, using screenshots you take with Playwright of public pages (no personal accounts). Save the redacted screenshot trail and a one-line outcome per step to `eval/manual/2026-10-30/`:
1. "Reject all cookies" on bbc.co.uk.
2. "Renew my passport" starting at gov.uk.
3. "Find a GP near me" starting at nhs.uk.
4. "Track a parcel" starting at royalmail.com.
5. "How do I cancel a subscription from Apple?" starting at support.apple.com.
Report which steps were right, wrong or honest-unsure. This is evidence, not marketing: write it down even if it fails.

## Review and close
- `code-review:code-review` and `security-review` on the day's diff (first deploy day). `agent-skills:web-performance-auditor` on `/app` if time allows.
- `00-common.md` §8 duties, including `.learnings/daily/2026-10-30.md` and the public URL in MEMORY.md.

## Definition of done (Day 4)
- **Public URL live** (WEB-3) and the core loop works there on a real screenshot.
- PRIV-1 Playwright test green in CI.
- FLOW-1 to FLOW-13 specs exist; failures listed honestly.
- 5 manual real-use-case runs recorded.

## Founder tasks today (human, ~45 min)
- Link GitHub to Vercel (if not done) when the agent asks.
- On your own phone, run one real task you actually need help with, using your own account: check what the privacy screen hid, and whether the steps were right. Write 3 lines of feedback into MEMORY.md (this is your first real use case).
- Read `.learnings/daily/2026-10-30.md`.
