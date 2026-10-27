# Daily agent prompts

One prompt per working day, in sync with [PHASES.md](../PHASES.md). Each prompt tells the agent to read [00-common.md](00-common.md) first (session protocol, skills, subagents, spend control, end-of-day duties), so the rules are written once and every day follows them.

## How to use

1. Each morning, open a **fresh** agent session in `/Users/jeeveshsingale/dev/ShowMe`.
2. Copy the whole file for that date and paste it as the first message. For Day 2 only, fill in the "Founder decisions" block first.
3. Let the agent run its phases. It stops only at the checkpoints written in the prompt, if spend would pass the day's ceiling, or if a privacy rule would be broken.
4. Do the "Founder tasks today" yourself. They are short, and they are where real-world evidence comes from.
5. Before bed, read `.learnings/daily/<date>.md` (the agent writes it) and answer its "explain it back" questions out loud.

If a day overruns, start the next day's prompt anyway: its carry-over check finishes or cuts the leftovers using the PHASES.md cut list.

## Schedule

| Date | Prompt | Theme | Phases | API ceiling | Founder time |
| --- | --- | --- | --- | --- | --- |
| Wed Oct 28 | [day-2-oct-28.md](day-2-oct-28.md) | Backend core + eval harness | Foundation · Core logic · API · Eval skeleton · First numbers | $3 | 30 min |
| Thu Oct 29 | [day-3-oct-29.md](day-3-oct-29.md) | Evaluation day + browser redaction | Benchmarks · Calibration checkpoint · Web skeleton · Redaction · Device timing | $25 | 45 min |
| Fri Oct 30 | [day-4-oct-30.md](day-4-oct-30.md) | Core loop live on a public URL | Client + start/review · Step view + states · Deploy · Real use-case smoke | $3 | 45 min |
| Sat Oct 31 | [day-5-oct-31.md](day-5-oct-31.md) | Share, accessibility, E2E suite | Supabase + share · Share UI · Accessibility · 20 real tasks | $4 | 30 min |
| Sun Nov 1 | [day-6-nov-01.md](day-6-nov-01.md) | Fix from evidence, real people, landing | Full E2E + triage · Top 3 fixes · Landing + /eval · Usability test · Voice (stretch) | $8 | 1.5 h |
| Mon Nov 2 | [day-7-nov-02.md](day-7-nov-02.md) | Hardening, final numbers, **freeze 23:59** | Requirement sweep · Security · Final eval · Perf + README · Stretch | $15 | 45 min |
| Tue Nov 3 | [day-8-nov-03.md](day-8-nov-03.md) | **Internal deadline**: test, fix, video, submission pack | Regression + bug bash · Video kit · README · Submission · Interview drill | $3 | 2.5 h |
| Wed Nov 4 | [day-9-nov-04-buffer.md](day-9-nov-04-buffer.md) | Buffer: verify and submit by 18:00 London | Verify · Submit · Judging-week runbook | $2 | 1 h |

API ceilings are maximums, not expectations. Expected spend from measured unit costs is about $45 for development and evaluation, plus up to $60 for the public demo during judging, which stays under the RISKS R6 trigger of $110 out of the $150 credit.

## Where the real use cases come from

- **Day 4:** 5 manual runs on real public sites (cookie rejection, passport renewal, GP search, parcel tracking, Apple subscription help), plus one task you genuinely need, done on your own phone.
- **Day 5:** a 20-task end-to-end suite on public sites (government services, health, travel, shopping returns, subscription help, accessibility settings, downloads), run automatically with Playwright.
- **Day 6:** a 15-minute usability test with 2 or 3 real people, including one task each of them genuinely needs.
- **Days 3 and 7:** public benchmarks (ScreenSpot-v2, ScreenSpot-Pro) plus negatives, prompt-injection and harmful-goal probes.

Every one of these writes its results to `eval/` and feeds the README, landing page and video, so the claim "it solves real use cases" comes with evidence.
