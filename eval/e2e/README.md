# E2E suite (EVAL-8)

20 public tasks, no login, each with a machine-checkable success predicate. The driver screenshots the target page, feeds it through the deployed web app's **real redaction pipeline**, calls `/v1/step`, performs the model's action (click point, type `type_text`, scroll), and repeats up to 10 steps. Success is only ever the task predicate.

## Run

```bash
# validate the task file — no network, no API spend
node eval/e2e/run.mjs --dry-run

# all 20 tasks against the deployed site, hard $3 budget (needs the D35 rate-limit raise: use scripts/e2e_live.sh)
make e2e E2E_LIMIT=20 E2E_BUDGET_USD=3

# explicit tasks / local web app / watch it happen
node eval/e2e/run.mjs --tasks e2e-01-bbc-cookies,e2e-13-wikipedia-spanish
node eval/e2e/run.mjs --web http://localhost:3000 --limit 2 --headed
```

Flags: `--web <base>` (default `https://showme-web-delta.vercel.app`), `--limit N`, `--tasks id1,id2`, `--out <dir>` (must not exist), `--budget-usd N` (default 3), `--step-reserve-usd N` (default and minimum 0.04, the pricing worst case), `--spend-file <path>` (default `eval/results/spend.json`), `--headed`, `--dry-run`.

## Cost

Every live step is one grounding call plus a SAM refine call: **~$0.0076 per step** (ground ~$0.0051 at `muse-spark-1.3` minimal + SAM ~$0.0025). Estimate for this suite: 20 tasks × 10 steps × $0.0076 ≈ **$1.52** before retries (up to 200 step calls plus up to 200 refine calls). The harness is a hard cap: each step is admitted only if charged + its $0.04 worst-case reserve (backend max_step_cost $0.029184 + SAM $0.0025, rounded up) fits `--budget-usd`; a missing or unreadable `cost_usd` is charged the full $0.04 reserve, never $0. At the end the charged total is appended once to `eval/results/spend.json`, keyed by the run directory, so a run is never counted twice. Check `eval/results/spend.json` and today's ceiling in `docs/prompts/day-5-oct-31.md` first. Nothing is spent on `--dry-run` or by re-reading `results.json`.

## Task file

`tasks.yaml` is a flat list; `run.mjs` has a tiny purpose-built parser (quotes stripped, no YAML escapes). Each task: `id`, `goal` (as a person types it), `start_url`, `viewport` (`desktop` 1280x800 or `mobile` iPhone 13 emulation 390x844), `predicate` (`url_regex` on the target URL, or `text_visible` / `text_gone` on rendered body text, case-insensitive regex), `max_steps` (10).

`deviceScaleFactor` is forced to 1 so screenshot pixels == CSS pixels == the model's point space; mobile is 7 tasks.

Predicate types also include `selector` (an active `aria-pressed="true"` toggle or a visible, non-blank element; mere presence never counts) and `cookie` (`name` + value regex). Known-flaky by nature, not hidden: `e2e-01` needs the BBC banner to render for the runner's location; `e2e-19` (YouTube captions) depends on the consent dialog, ads and a caption cue playing. Popups/new tabs are not followed — a task whose action opens a new tab reads as a miss.

## Output

`eval/results/<YYYY-MM-DD>-e2e-<sha>-<HHMMSS><hex>/` (unique per run; an existing directory is refused, so evidence is never overwritten):

- `results.json` — `{date, git_sha, web, tasks_selected, budget_usd, cost_usd, charged_usd, unknown_cost_responses, step_reserve_usd, stopped_on_budget, tasks: [{id, success, steps, cost_usd, honesty_events, refused, error?}], success_rate, avg_steps}`.
- `highlight_ratings.csv` — per-run highlight rating sheet (the committed `eval/e2e/highlight_ratings.csv` is the frozen sheet from the 2026-11-01 run).
- `report.md` — generated from `results.json` by the driver; never hand-edited.
- `trail/<task-id>/step-<n>.jpg` — the redacted image the app actually sent (decoded from the `/v1/step` request body), i.e. evidence of the redaction pipeline.
- `trail/<task-id>/steps.jsonl` — one line per step: request metadata (`goal`, `image_meta`, `history_len`), the full `StepResponse`, the action taken, and the predicate result.

Honesty events are recorded per step: `unsure`, `not_visible`, `refuse` (refusals also set `refused: true` and stop the task).

## Live run procedure (rate limits)

Production allows 30 steps/hour per IP, which stops a 20-task run partway (D35). `scripts/e2e_live.sh [budget]` requires a clean tree, refuses to start if `RATE_PER_*` is already set, sets `RATE_PER_HOUR`/`RATE_PER_DAY` to 500 on production, redeploys the backend, runs `make e2e E2E_LIMIT=20`, and on any exit (including failure or Ctrl-C) removes both variables, redeploys and verifies they are gone. Spend caps are not changed. Audit every passing trail before publishing a percentage.
