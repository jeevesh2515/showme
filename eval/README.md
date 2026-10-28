# ShowMe eval harness

Scores `showme.core` on ScreenSpot-v2 and ScreenSpot-Pro with the production prompt,
schema, post-processing and image preprocessing (EVAL-2). Datasets are **not** committed.

## Fetch datasets (into `eval/data/`, gitignored)

ScreenSpot-v2 (Apache-2.0) — three annotation files, 1.33 GB image zip:

```bash
mkdir -p eval/data/screenspot-v2/images && cd eval/data/screenspot-v2
base=https://huggingface.co/datasets/OS-Copilot/ScreenSpot-v2/resolve/main
curl -LO $base/screenspot_desktop_v2.json
curl -LO $base/screenspot_mobile_v2.json
curl -LO $base/screenspot_web_v2.json
curl -L -o images.zip $base/screenspotv2_image.zip && unzip -q images.zip -d images
cd -
```

ScreenSpot-Pro (MIT) — annotations only first, then fetch just the sampled images:

```bash
mkdir -p eval/data/screenspot-pro
huggingface-cli download likaixin/ScreenSpot-Pro --repo-type dataset \
  --include "annotations/*.json" --local-dir eval/data/screenspot-pro
# images: eval/data/screenspot-pro/images/<img_filename from the annotations>
```

Boxes are drawn as red rectangles by `draw_debug(...)` so the format can be checked once
per dataset: `python -c "from showme_eval.datasets import *; draw_debug(load_v2_local('data/screenspot-v2'), 'debug', 5)"`.

## Run

```bash
set -a; . ./.env; set +a
uv run --project eval python -m showme_eval --suite screenspot-v2 --split dev --n 100
uv run --project eval python -m showme_eval --suite screenspot-v2 --split heldout --headline
uv run --project eval python -m showme_eval --suite screenspot-pro --n 300
```

Options: `--model` (default `muse-spark-1.3`), `--effort` (default `minimal`),
`--sam on|off`, `--headline` (rejected for `--split dev`, EVAL-9).

Outputs `eval/results/<date>-<suite>-<config>/` with `predictions.jsonl` (EVAL-7),
`summary.json`, `report.md`, and updates `eval/results/spend.json`. Responses are cached
under `<run dir>/cache/` by `(model, effort, prompt_version, image_sha256, instruction, sam_on)`,
so an unchanged rerun costs $0.

## Tests

```bash
uv run --project eval pytest eval/tests -q
```

Tests never call the Meta API and need no dataset.
