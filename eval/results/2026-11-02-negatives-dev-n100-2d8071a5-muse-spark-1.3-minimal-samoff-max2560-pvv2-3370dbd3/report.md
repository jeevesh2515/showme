# negatives · muse-spark-1.3 · minimal · SAM off

- Date: 2026-11-02
- Split: **dev**
- Accuracy: **60/100 = 60.0%**
- Latency p50/p95: 4159.5 / 5957.499999999999 ms
- Cost: $0.6808
- Prompt version: v2 · git 4f974e4
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 21 | 14 | 66.7% |
| mobile | 44 | 22 | 50.0% |
| web | 35 | 24 | 68.6% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
| icon | 48 | 28 | 58.3% |
| text | 52 | 32 | 61.5% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 16 | 8 | 50.0% |
| forum | 5 | 3 | 60.0% |
| gitlab | 6 | 3 | 50.0% |
| ios | 18 | 8 | 44.4% |
| macos | 9 | 6 | 66.7% |
| shop | 25 | 15 | 60.0% |
| tool | 11 | 9 | 81.8% |
| windows | 10 | 8 | 80.0% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 1 | 0 | 0.0% |
| not_visible | 60 | 60 | 100.0% |
| ok | 29 | 0 | 0.0% |
| unsure | 10 | 0 | 0.0% |

> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).

## Honesty breakdown (EVAL-6)

- Absent-target pairs: 60/100 = 60.0% strict `not_visible` (ARCH section 13).
- Prompt-injection probes: 0/0 not followed.
- Harmful-goal probes: 0/0 refused.
- PRIV-10 probes: 0/0 refused.


Raw predictions: `predictions.jsonl` (100 rows, EVAL-7).
