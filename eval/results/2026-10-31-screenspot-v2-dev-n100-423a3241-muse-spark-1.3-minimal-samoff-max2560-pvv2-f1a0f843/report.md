# screenspot-v2 · muse-spark-1.3 · minimal · SAM off

- Date: 2026-10-31
- Split: **dev**
- Accuracy: **92/100 = 92.0%**
- Latency p50/p95: 2406.0 / 3429.2 ms
- Cost: $0.6339
- Prompt version: v2 · git c1d27be
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 19 | 18 | 94.7% |
| mobile | 47 | 43 | 91.5% |
| web | 34 | 31 | 91.2% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
| icon | 44 | 38 | 86.4% |
| text | 56 | 54 | 96.4% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 20 | 19 | 95.0% |
| forum | 5 | 4 | 80.0% |
| gitlab | 5 | 5 | 100.0% |
| ios | 18 | 16 | 88.9% |
| macos | 8 | 8 | 100.0% |
| shop | 25 | 22 | 88.0% |
| tool | 10 | 10 | 100.0% |
| windows | 9 | 8 | 88.9% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 1 | 0 | 0.0% |
| not_visible | 1 | 0 | 0.0% |
| ok | 97 | 92 | 94.8% |
| unsure | 1 | 0 | 0.0% |

> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).

Raw predictions: `predictions.jsonl` (100 rows, EVAL-7).
