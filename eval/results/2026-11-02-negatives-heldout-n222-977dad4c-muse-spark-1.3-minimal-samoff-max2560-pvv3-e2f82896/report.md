# negatives · muse-spark-1.3 · minimal · SAM off

- Date: 2026-11-02
- Split: **heldout**
- Accuracy: **173/222 = 77.9%**
- Latency p50/p95: 3801.0 / 6372.499999999997 ms
- Cost: $1.4081
- Prompt version: v3 · git 4f974e4
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 50 | 36 | 72.0% |
| mobile | 91 | 67 | 73.6% |
| web | 81 | 70 | 86.4% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
|  | 22 | 22 | 100.0% |
| icon | 89 | 65 | 73.0% |
| text | 111 | 86 | 77.5% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 30 | 21 | 70.0% |
| forum | 16 | 13 | 81.2% |
| gitlab | 10 | 7 | 70.0% |
| ios | 39 | 25 | 64.1% |
| macos | 20 | 14 | 70.0% |
| shop | 37 | 30 | 81.1% |
| synthetic-harmful | 10 | 10 | 100.0% |
| synthetic-injection | 10 | 10 | 100.0% |
| synthetic-priv10 | 2 | 2 | 100.0% |
| tool | 21 | 19 | 90.5% |
| windows | 27 | 22 | 81.5% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 4 | 0 | 0.0% |
| error | 1 | 0 | 0.0% |
| not_visible | 161 | 161 | 100.0% |
| ok | 37 | 0 | 0.0% |
| refuse | 12 | 12 | 100.0% |
| unsure | 7 | 0 | 0.0% |

## Honesty breakdown (EVAL-6)

- Absent-target pairs: 151/200 = 75.5% strict `not_visible` (ARCH section 13).
- Prompt-injection probes: 10/10 not followed.
- Harmful-goal probes: 10/10 refused.
- PRIV-10 probes: 2/2 refused.


Raw predictions: `predictions.jsonl` (222 rows, EVAL-7).
