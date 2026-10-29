# Results (generated from summary.json files; do not hand-edit)

| date | suite | split | model | effort | n | accuracy | predictions |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-10-28 | screenspot-v2 | dev | muse-spark-1.3 | minimal | 10 | 90.0% | `2026-10-28-screenspot-v2-dev-n10-c99e8b8f-muse-spark-1.3-minimal-samoff-max2560-pvv1-a8155fb4/predictions.jsonl` |
| 2026-10-28 | screenspot-v2 | dev | muse-spark-1.3 | minimal | 100 | 93.0% | `2026-10-28-screenspot-v2-muse-spark-1.3-minimal-samoff-max0/predictions.jsonl` |
| 2026-10-28 | screenspot-v2 | dev | muse-spark-1.3 | minimal | 100 | 85.0% | `2026-10-28-screenspot-v2-muse-spark-1.3-minimal-samoff-max1920/predictions.jsonl` |
| 2026-10-28 | screenspot-v2 | dev | muse-spark-1.3 | minimal | 100 | 93.0% | `2026-10-28-screenspot-v2-muse-spark-1.3-minimal-samoff-max2560/predictions.jsonl` |
| 2026-10-29 | negatives | heldout | muse-spark-1.3 | minimal | 222 | 64.4% | `2026-10-29-negatives-heldout-n222-977dad4c-muse-spark-1.3-minimal-samoff-max2560-pvv1-d9f845cc/predictions.jsonl` |
| 2026-10-29 | screenspot-pro | heldout | muse-spark-1.3 | minimal | 300 | 63.7% | `2026-10-29-screenspot-pro-heldout-n300-e08c4fce-muse-spark-1.3-minimal-samoff-max2560-pvv1-31fc78be/predictions.jsonl` |
| 2026-10-29 | screenspot-pro | heldout | muse-wonder-1.0 | minimal | 300 | 66.7% | `2026-10-29-screenspot-pro-heldout-n300-e08c4fce-muse-wonder-1.0-minimal-samoff-max2560-pvv1-a69a5cf9/predictions.jsonl` |
| 2026-10-29 | screenspot-v2 | heldout | muse-spark-1.3 | minimal | 100 | 90.0% | `2026-10-29-screenspot-v2-heldout-n100-62ed230b-muse-spark-1.3-minimal-samon-max2560-pvv1-80346d48/predictions.jsonl` |
| 2026-10-29 | screenspot-v2 | heldout | muse-spark-1.3 | minimal | 100 | 91.0% | `2026-10-29-screenspot-v2-heldout-n100-62ed230b-muse-spark-1.3-minimal-samon-max2560-pvv1-9dd53b24/predictions.jsonl` |
| 2026-10-29 | screenspot-v2 | heldout | muse-spark-1.3 | minimal | 1172 | 90.7% | `2026-10-29-screenspot-v2-heldout-n1172-99e1c829-muse-spark-1.3-minimal-samoff-max2560-pvv1-26831bd6/predictions.jsonl` |

## Calibration and verifier (generated)

- AUROC 0.6224938938610648, tau 0.96: `2026-10-29-calibration-v2heldout/calibration.md`
- Verifier (dev): precision 0.9587628865979382 -> 0.9647058823529412, kept 85/97: `2026-10-29-verifier-dev100/summary.json`
- Verifier (heldout-cached): precision 0.9250871080139372 -> 0.9333958724202627, kept 1066/1148: `2026-10-29-verifier-heldout-cached/summary.json`
