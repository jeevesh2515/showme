You are the founding engineer for ShowMe in /Users/jeeveshsingale/dev/ShowMe. Today is **Day 5, Sat Oct 31, 2026**. Theme: **sharing, accessibility, and the end-to-end task suite**. Budget for live API calls today: **$4**.

## Read first
1. `docs/prompts/00-common.md` and its session start protocol (carry-over check against Day 4 DoD; read the founder's real-use feedback in MEMORY.md and fix anything blocking before new work).
2. `docs/ARCHITECTURE.md` §8 (guides, Supabase, expiry), §9 (rate limits and spend cap), §13 (E2E suite).
3. `docs/DESIGN.md` §4.5, §4.6 (share screens), §5 (accessibility).
4. `docs/REQUIREMENTS.md` IDs: PRIV-5, API-6, A11Y-1 to A11Y-7, FLOW-13, EVAL-8.

## Phase 1 · Supabase, share links, purge (subagent S, sonnet; owns `backend/showme/api/guides.py`, the Supabase rate-limit backend, SQL migrations, and their tests)
- Supabase project in the EU region. Apply the SQL in ARCHITECTURE §8 as a migration file in `backend/migrations/`. RLS on, no policies; backend uses the service role key only.
- Private bucket `guides`. `POST /v1/guides`, `GET /v1/guides/{token}` (10-minute signed URLs, 404 for unknown and expired alike), `DELETE` with `X-Delete-Key`. Token: `secrets.token_urlsafe(16)`, store only SHA-256 of token and delete key.
- `/internal/purge` deletes expired rows **and** their storage objects and `usage_counters` older than 48 h; Vercel Cron daily with `X-Cron-Secret`.
- Supabase-backed `RateLimiter` and `SpendCap` (per-IP salted daily hash, 30 per hour and 150 per day steps, 5 guides per day, $5 per day and $60 total by default) (API-6).
- Tests: expiry on read with a short TTL, purge removes objects, delete key, token never stored raw, rate limit and cap responses (429 and 503 with DESIGN §4.7 copy).

## Phase 2 · Share flow in the web app (you)
- Done screen → Share: second review of every step image, consent checkbox, "Create link", copy button, expiry in words, delete link (DESIGN §4.5, PRIV-5).
- `/g/[token]`: read-only stepper, expiry banner, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: no-referrer`.
- **Check:** create a link on the deployed site, open it in a private window, delete it, confirm 404.

## Phase 3 · Accessibility pass (subagent A, sonnet; owns accessibility fixes in `apps/web/components/` after you finish Phase 2)
- A11Y-1 to A11Y-7: text size control (100, 125, 150%), high-contrast toggle (tab-scoped), keyboard shortcuts (N, R, Esc), focus ring, `aria-live` instruction card, alt text that names the target, reduced motion, 48 px targets.
- Playwright with axe on every screen, keyboard-only run, 200% zoom run. VoiceOver smoke test notes in MEMORY.md.

## Phase 4 · End-to-end task suite (subagent E, sonnet; owns `eval/e2e/`)
Build `eval/e2e/tasks.yaml` with 20 real use cases on public sites that need no login. Each task: id, goal (as a real person would type it), start URL, viewport (desktop 1280x800 or iPhone emulation for at least 6 tasks), success predicate (URL regex or visible text), max steps 10. Start from these candidates; open each first and replace any that needs login, blocks automation, or has no stable success signal (log replacements in MEMORY.md):
1. Reject all cookies on bbc.co.uk (predicate: consent banner gone)
2. Renew an adult passport, starting at gov.uk
3. Check UK bank holidays, starting at gov.uk
4. Find a GP, starting at nhs.uk
5. Get help from NHS 111 online, starting at nhs.uk
6. See the London weather forecast on BBC Weather
7. Plan a train journey, starting at nationalrail.co.uk
8. Track a parcel, starting at royalmail.com
9. Find IKEA UK's returns policy
10. Read how to cancel a subscription from Apple, starting at support.apple.com
11. Read how to cancel Netflix, starting at help.netflix.com
12. Read how to change a Gmail password, starting at support.google.com
13. Switch a Wikipedia article to Spanish
14. Open a Wikipedia article's talk page
15. Download Python for macOS, starting at python.org (predicate: downloads page for macOS)
16. Find GitHub's pricing page
17. Download Firefox, starting at mozilla.org
18. Find the contact page on a public library or council website
19. Turn on captions on a public YouTube video (mobile viewport)
20. Find opening hours of a national museum (e.g. Natural History Museum)
- Playwright driver (ARCHITECTURE §13): screenshot → the real redaction pipeline → `/v1/step` → perform the action (click point, type `type_text`, scroll) → repeat. Save the redacted screenshot trail and every StepResult. Report success rate, average steps, honesty events (`unsure`, `not_visible`), refusals.
- Run the first 10 tasks today against the deployed backend. Generated report in `eval/results/<date>-e2e/`.

## Review and close
- `security-review` and `agent-skills:security-auditor` on guides, storage, cron and rate limits (they touch persistence).
- `00-common.md` §8 duties, including `.learnings/daily/2026-10-31.md`; update `.learnings/04-privacy-and-security.md` and `05-rate-limits-cost-and-scale.md` with what is now built and tested.

## Definition of done (Day 5)
- Share link works end to end on the live site and expires in a short-TTL test.
- axe clean on all screens; keyboard-only run passes.
- First E2E numbers (10 tasks) written by the harness.

## Founder tasks today (human, ~30 min)
- Create the Supabase project when asked (EU region) and add the keys to Vercel env vars yourself if the agent cannot.
- Try the app with keyboard only and with your phone's text size at maximum; note anything awkward in MEMORY.md.
- Read `.learnings/daily/2026-10-31.md`.
