# E2E suite (EVAL-8)

20 public tasks, no login, each with a machine-checkable success predicate. The driver screenshots the target page, feeds it through the deployed web app's **real redaction pipeline**, calls `/v1/step`, performs the model's action (click point, type `type_text`, scroll), and repeats up to 10 steps. Success is only ever the task predicate.

## Run

```bash
# validate the task file — no network, no API spend
node eval/e2e/run.mjs --dry-run

# first 10 tasks against the deployed site
node eval/e2e/run.mjs --limit 10

# explicit tasks / local web app / watch it happen
node eval/e2e/run.mjs --tasks e2e-01-bbc-cookies,e2e-13-wikipedia-spanish
node eval/e2e/run.mjs --web http://localhost:3000 --limit 2 --headed
```

Flags: `--web <base>` (default `https://showme-web-delta.vercel.app`), `--limit N`, `--tasks id1,id2`, `--out <dir>`, `--headed`, `--dry-run`.

## Cost

Every live step is one grounding call plus a SAM refine call: **~$0.0076 per step** (ground ~$0.0051 at `muse-spark-1.3` minimal + SAM ~$0.0025). Worst case for this suite is 20 tasks × 10 steps ≈ **$1.50**. Check `eval/results/spend.json` and today's ceiling in `docs/prompts/day-5-oct-31.md` first. Nothing is spent on `--dry-run` or by re-reading `results.json`.

## Task file

`tasks.yaml` is a flat list; `run.mjs` has a tiny purpose-built parser (quotes stripped, no YAML escapes). Each task: `id`, `goal` (as a person types it), `start_url`, `viewport` (`desktop` 1280x800 or `mobile` iPhone 13 emulation 390x844), `predicate` (`url_regex` on the target URL, or `text_visible` / `text_gone` on rendered body text, case-insensitive regex), `max_steps` (10).

`deviceScaleFactor` is forced to 1 so screenshot pixels == CSS pixels == the model's point space; mobile is 7 tasks.

Known-flaky by nature, not hidden: `e2e-01` passes trivially if the BBC cookie banner never renders for the runner's location; `e2e-19` (YouTube captions) depends on the consent dialog, ads and the caption renderer surfacing lyric text in the DOM. Popups/new tabs are not followed — a task whose action opens a new tab reads as a miss.

## Output

`eval/results/<YYYY-MM-DD>-e2e/`:

- `results.json` — `{date, web, tasks: [{id, success, steps, honesty_events, refused, error?}], success_rate, avg_steps}`.
- `report.md` — generated from `results.json` by the driver; never hand-edited.
- `trail/<task-id>/step-<n>.jpg` — the redacted image the app actually sent (decoded from the `/v1/step` request body), i.e. evidence of the redaction pipeline.
- `trail/<task-id>/steps.jsonl` — one line per step: request metadata (`goal`, `image_meta`, `history_len`), the full `StepResponse`, the action taken, and the predicate result.

Honesty events are recorded per step: `unsure`, `not_visible`, `refuse` (refusals also set `refused: true` and stop the task).
