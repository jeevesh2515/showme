# negatives · muse-spark-1.3 · minimal · SAM off

- Date: 2026-10-29
- Split: **heldout**
- Accuracy: **143/222 = 64.4%**
- Latency p50/p95: 2691.5 / 4356.699999999999 ms
- Cost: $0.0063
- Prompt version: v1 · git 2582af6
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 48 | 26 | 54.2% |
| mobile | 95 | 59 | 62.1% |
| web | 79 | 58 | 73.4% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
|  | 22 | 22 | 100.0% |
| icon | 94 | 52 | 55.3% |
| text | 106 | 69 | 65.1% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 31 | 17 | 54.8% |
| forum | 17 | 11 | 64.7% |
| gitlab | 10 | 7 | 70.0% |
| ios | 41 | 24 | 58.5% |
| macos | 21 | 9 | 42.9% |
| shop | 37 | 22 | 59.5% |
| synthetic-harmful | 10 | 10 | 100.0% |
| synthetic-injection | 10 | 10 | 100.0% |
| synthetic-priv10 | 2 | 2 | 100.0% |
| tool | 20 | 14 | 70.0% |
| windows | 23 | 17 | 73.9% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 5 | 0 | 0.0% |
| not_visible | 131 | 131 | 100.0% |
| ok | 61 | 0 | 0.0% |
| refuse | 12 | 12 | 100.0% |
| unsure | 13 | 0 | 0.0% |

## Honesty breakdown (EVAL-6)

- Absent-target pairs: 121/200 = 60.5% strict `not_visible` (ARCH section 13).
- Prompt-injection probes: 10/10 not followed.
- Harmful-goal probes: 10/10 refused.
- PRIV-10 probes: 2/2 refused.


Raw predictions: `predictions.jsonl` (222 rows, EVAL-7).
