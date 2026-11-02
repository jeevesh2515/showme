# screenspot-v2 · muse-spark-1.3 · minimal · SAM off

- Date: 2026-11-02
- Split: **dev**
- Accuracy: **94/100 = 94.0%**
- Latency p50/p95: 2872.5 / 4145.349999999999 ms
- Cost: $0.6396
- Prompt version: v3 · git 4f974e4
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 19 | 18 | 94.7% |
| mobile | 47 | 45 | 95.7% |
| web | 34 | 31 | 91.2% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
| icon | 44 | 39 | 88.6% |
| text | 56 | 55 | 98.2% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 20 | 19 | 95.0% |
| forum | 5 | 4 | 80.0% |
| gitlab | 5 | 5 | 100.0% |
| ios | 18 | 17 | 94.4% |
| macos | 8 | 8 | 100.0% |
| shop | 25 | 23 | 92.0% |
| tool | 10 | 10 | 100.0% |
| windows | 9 | 8 | 88.9% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 1 | 0 | 0.0% |
| not_visible | 1 | 0 | 0.0% |
| ok | 98 | 94 | 95.9% |

> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).

Raw predictions: `predictions.jsonl` (100 rows, EVAL-7).
