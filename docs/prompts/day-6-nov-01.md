You are the founding engineer for ShowMe in /Users/jeeveshsingale/dev/ShowMe. Today is **Day 6, Sun Nov 1, 2026**. Theme: **fix what the evidence says, test with real people, and build the landing page**. Budget for live API calls today: **$8**.

## Read first
1. `docs/prompts/00-common.md` and its session start protocol (carry-over check against Day 5 DoD).
2. `eval/results/RESULTS.md`, the latest E2E report, `eval/manual/` notes and the founder's feedback in MEMORY.md. These decide today's fixes.
3. `docs/DESIGN.md` §6 (landing page outline) and §8 (copy rules); `docs/PRD.md` §7 (founder narrative) and §8 (business hypothesis).
4. `docs/REQUIREMENTS.md` IDs: EVAL-8, EVAL-9, WEB-1, WEB-2; `docs/RISKS.md` R1 to R5.

## Phase 1 · Full E2E run and failure triage (morning)
- Run all 20 E2E tasks against the deployed backend (`make e2e`). Generated report only.
- Build `eval/e2e/highlight_ratings.csv` with one row per step (task, step, screenshot path, model box vs outline shown) and leave the rating column empty for the founder (good / partial / wrong).
- Triage: cluster every failed or wrong step from E2E, `eval/manual/` and the negatives suite into failure modes (for example "icon-only buttons", "cookie banners", "target below the fold", "wrong menu level"). Write the top 3 with counts and example paths to MEMORY.md.

## Phase 2 · Fix the top 3 failure modes (critical path, you)
- Fix each mode at the right layer: prompt (bump `PROMPT_VERSION`), post-processing, UI copy, or a product rule. One fix at a time.
- Measure every prompt change on the **dev split only** (EVAL-9) plus the failing E2E tasks. Keep a change only if the dev split does not drop by more than 1 point and the targeted failures improve. Record each kept or rejected change as a D-number with numbers.
- Never tune on the held-out split or ScreenSpot-Pro. Final headline numbers are re-run on Day 7.

## Phase 3 · Landing page and eval page (subagent L, sonnet; owns `apps/web/app/(marketing)/` and `apps/web/app/eval/`)
- Load `frontend-design:frontend-design` first; follow DESIGN §6 exactly: one orchestrated hero moment (the ring drawing onto a real, clearly synthetic screenshot), how it works (3 real steps), private by design, how often it is right (numbers read from `RESULTS.md` at build time, including the weakest), for families, for companies (mailto only, no form that stores emails), built with Meta models, footer.
- `/eval` renders `RESULTS.md` with links to the raw files (WEB-2).
- No number is typed into the page by hand: the build reads it from the results files (RULES §2).
- Lighthouse ≥ 90 for performance and accessibility (WEB-1); `agent-skills:web-performance-auditor` if below.

## Phase 4 · Real people, real use cases (with the founder, afternoon)
Prepare a 15-minute test kit for the founder in `eval/usability/` (printable):
- Consent note (no recording of faces or accounts; notes only; they can stop anytime).
- 3 tasks: one public task from the E2E list, one task the participant genuinely needs on their own device, one "find something that is not on this screen" task (tests honesty).
- Observation sheet: time on privacy review screen, wrong taps, moments of confusion, quotes, "would you use this again?" (1 to 5), "did you trust what it showed?" (1 to 5).
After the founder runs it with 2 or 3 people, turn the sheets into `eval/usability/2026-11-01-summary.md` with counts and quotes, and add the top issue to tomorrow's fixes if it is a blocker. This is qualitative evidence: present it as "n = 3, not a study".

## Phase 5 · Stretch S1: spoken goal (only if Days 2 to 5 DoD are all green and Phases 1 to 3 are done)
- `/v1/transcribe` via Muse Voice Transcribe (fetch the current docs page first), max 60 s, typed input always visible, mic permission only on `/app` (FLOW-14). Otherwise skip and record "not built".

## Review and close
- `code-review:code-review` on the day's diff; `agent-skills:test-engineer` on any new prompt version (are the edge-case tests still right?).
- `00-common.md` §8 duties, including `.learnings/daily/2026-11-01.md`; update `.learnings/06`, `07` and `10` with real E2E and usability findings.

## Definition of done (Day 6)
- E2E success rate and average steps reported by the harness for all 20 tasks.
- Top 3 failure modes addressed with measured before and after numbers (or recorded as unfixed).
- Landing and `/eval` pages live; every number traceable to a results file.
- Usability kit ready; summary written if sessions happened.

## Founder tasks today (human, ~1.5 h)
- Rate highlight quality in `eval/e2e/highlight_ratings.csv` (about 20 minutes).
- Run the usability kit with 2 or 3 people (a relative, a friend, a neighbour). This is how you will know ShowMe solves a real use case, and it gives you real quotes for the video and the judges.
- Read `.learnings/daily/2026-11-01.md`.
