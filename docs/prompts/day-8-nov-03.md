You are the founding engineer for ShowMe in /Users/jeeveshsingale/dev/ShowMe. Today is **Day 8, Tue Nov 3, 2026**: the **internal deadline (23:59 London)**. Feature freeze is in force: bug fixes, copy, docs, video and submission only. Budget for live API calls today: **$3**.

Goal for today: by 23:59 everything the submission form needs exists, works on a fresh clone and on the live URL, and the founder can explain all of it.

## Read first
1. `docs/prompts/00-common.md` and its session start protocol (carry-over check against Day 7 DoD and the freeze entry in MEMORY.md).
2. `docs/DESIGN.md` §7 (demo video script), `docs/PRD.md` §7 and §8, `README.md` draft, `eval/results/RESULTS.md`, `docs/REQUIREMENTS_STATUS.md`.
3. The hackathon submission requirements recorded in MEMORY.md Q4. If they are still missing, ask the founder first thing; the checklist in Phase 4 depends on them.

## Phase 1 · Full regression and bug bash (morning; fixes only)
- Fresh-clone dry run in a temp directory: `git clone`, `make setup`, `make lint test`, `make eval SUITE=negatives N=20` (EVAL-1, ENG-1). Fix anything that only worked on this machine.
- Production QA checklist (write it to `eval/qa/2026-11-03.md` and fill it): desktop Chrome, Safari, Firefox; iPhone Safari; Android Chrome; paste, drag, file picker; privacy review (tap, brush, undo); each state (ok, unsure, not_visible, done, refuse, caution); share create, open, delete; rate-limit and error copy; keyboard-only; 200% zoom; reduced motion; high contrast.
- Every bug found gets a failing test first, then the fix (`superpowers:systematic-debugging`), then a re-deploy. Anything not fixable today goes into README Limitations, not hidden.

## Phase 2 · Demo video kit (with the founder)
- Prepare `demo/` (gitignored large files): a shot list from DESIGN §7 with exact screens, the screenshots to use (public sites plus the founder's own redacted account for the subscription example, only if the founder agrees), and the browser state for each shot (zoom level, high contrast off, clean tab).
- Rehearse the live flow end to end on the production URL with each demo screenshot so the founder records real runs (RULES §2: live product, no edited overlays; say "best of N" if a take is chosen).
- Write captions (SRT) from the final voice-over script. Keep the video 2:00 to 3:00.

## Phase 3 · README and repo polish (subagent P, sonnet; owns `README.md`, `docs/` formatting, repo metadata)
- Final README (ENG-4): one-paragraph what and why; demo video link and GIF; live URL; how it works diagram; Meta models used and exactly where (Muse Spark 1.3 grounding, SAM 3.1 outline, plus Wonder or Voice Transcribe only if shipped); results table generated from `RESULTS.md` with links to raw files; privacy section; limitations; one-command setup; eval reproduction; licence; dataset and model citations; acknowledgements.
- GitHub: description, topics, website link, no secrets in history (gitleaks), CI badge green.
- `agent-skills:code-reviewer` reads the README as a skeptical judge and lists every claim not backed by a file; fix each.

## Phase 4 · Submission package
- `docs/SUBMISSION.md`: every field the form asks for (from MEMORY.md Q4), drafted: project name, one-liner, problem, solution, how Meta models are used, technical highlights, eval results (numbers with links), business hypothesis (labelled as hypothesis), what is next, links (live URL, repo, video), team.
- Cross-check every number in SUBMISSION.md, README, landing page and video script against `RESULTS.md` with a small script; mismatches fail.
- Final deploy from tag `v1.0.0` (bump from rc1 with today's fixes); smoke test on phone and desktop.

## Phase 5 · Founder readiness (evening, 45 min)
- Refresh all of `.learnings/` with final numbers and statuses (from files only).
- Write `.learnings/11-final-interview-drill.md`: 25 rapid-fire questions mixed across all topics, each with a 1-sentence answer and the source file. Then quiz the founder interactively: ask 10 of them one at a time, wait for the answer, and grade it against the docs (correct, partly, wrong, with the right answer). Record weak areas in the founder briefing.

## Review and close
- `00-common.md` §8 duties, including `.learnings/daily/2026-11-03.md`.
- Final message: submission readiness checklist with every item ticked or explained, the exact links, total project spend, and what (if anything) remains for the Nov 4 buffer.

## Definition of done (Day 8)
- Fresh-clone dry run passes; production QA checklist complete; known issues in README Limitations.
- Video recorded (or recording-ready with the founder's slot booked for Nov 4 morning at the latest).
- README, SUBMISSION.md and landing page agree with RESULTS.md (checked by script).
- `v1.0.0` tagged and deployed.

## Founder tasks today (human, ~2.5 h)
- Record the demo video with the kit (about 90 minutes including retakes) and upload it (unlisted YouTube or the platform the rules require).
- Read SUBMISSION.md and README end to end and change anything that is not in your voice or not true for you.
- Do the interview drill with the agent.
