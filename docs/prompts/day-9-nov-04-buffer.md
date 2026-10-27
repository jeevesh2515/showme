You are the founding engineer for ShowMe in /Users/jeeveshsingale/dev/ShowMe. Today is **Wed Nov 4, 2026: buffer and submission day**. Official deadline 21:00 EST = **Thu Nov 5, 02:00 London**. Target: **submitted by 18:00 London**. No new features. Budget for live API calls today: **$2** (verification only).

## Read first
1. `docs/prompts/00-common.md` (session start protocol, but the carry-over check is against Day 8 DoD only).
2. `docs/SUBMISSION.md`, `README.md`, the last MEMORY.md entry, `.learnings/daily/2026-11-03.md`.

## Phase 1 · Verify, do not build (morning)
- Live URL: run the full flow once on desktop and once on a phone with a public screenshot; `/v1/healthz` 200; share link create, open, delete.
- Repo: public, README renders, CI green on `main`, tag `v1.0.0` present, `make smoke` passes from a fresh clone.
- Video: plays, length within the rules, captions on, link visibility correct.
- Numbers: re-run the cross-check script (SUBMISSION.md, README, landing page vs `RESULTS.md`).
- Spend: current total vs the $150 credit; confirm the public demo caps are on and correct for judging week (Nov 4 to 8).
- Only critical bug fixes today (the app is broken for a main flow). Anything else goes into README Limitations.

## Phase 2 · Submit (by 18:00 London)
- Walk the founder through the submission form field by field using SUBMISSION.md. The founder submits; you never submit on their behalf.
- After submission: MEMORY.md entry with the submission time, links and final spend; `.learnings/00-step-log.md` final entry.

## Phase 3 · Judging-week watch (after submission)
- Write `docs/RUNBOOK.md`: how to check health, logs and spend daily during Nov 4 to 8; what to do if the spend cap trips (RISKS R6 demo mode); how to roll back on Vercel; who to contact.
- Do not change production during judging except to fix an outage; record any change in MEMORY.md.

## Definition of done
- Submission confirmed by the founder before 18:00 London, with links recorded in MEMORY.md.
- RUNBOOK.md exists.
