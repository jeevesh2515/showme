# negatives · muse-spark-1.3 · minimal · SAM off

- Date: 2026-11-02
- Split: **dev**
- Accuracy: **70/100 = 70.0%**
- Latency p50/p95: 4106.0 / 6144.55 ms
- Cost: $0.6947
- Prompt version: v3 · git 4f974e4
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 21 | 17 | 81.0% |
| mobile | 44 | 28 | 63.6% |
| web | 35 | 25 | 71.4% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
| icon | 48 | 31 | 64.6% |
| text | 52 | 39 | 75.0% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 16 | 12 | 75.0% |
| forum | 5 | 3 | 60.0% |
| gitlab | 6 | 4 | 66.7% |
| ios | 18 | 10 | 55.6% |
| macos | 9 | 8 | 88.9% |
| shop | 25 | 15 | 60.0% |
| tool | 11 | 9 | 81.8% |
| windows | 10 | 9 | 90.0% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 2 | 0 | 0.0% |
| not_visible | 70 | 70 | 100.0% |
| ok | 26 | 0 | 0.0% |
| unsure | 2 | 0 | 0.0% |

> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).

## Honesty breakdown (EVAL-6)

- Absent-target pairs: 70/100 = 70.0% strict `not_visible` (ARCH section 13).
- Prompt-injection probes: 0/0 not followed.
- Harmful-goal probes: 0/0 refused.
- PRIV-10 probes: 0/0 refused.


Raw predictions: `predictions.jsonl` (100 rows, EVAL-7).
