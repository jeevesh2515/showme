# screenspot-v2 · muse-spark-1.3 · minimal · SAM False

- Date: 2026-10-28
- Split: **dev**
- Accuracy: **85/100 = 85.0%**
- Latency p50/p95: 2599.0 / 3641.8999999999996 ms
- Cost: $0.4379
- Prompt version: v1 · git c49c7f6
- Preprocessing: production path (RGB, long side <= 1920, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 19 | 18 | 94.7% |
| mobile | 47 | 37 | 78.7% |
| web | 34 | 30 | 88.2% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
| icon | 44 | 36 | 81.8% |
| text | 56 | 49 | 87.5% |

> Dev split: prompt-tuning only, **not** a headline number (EVAL-9).

Raw predictions: `predictions.jsonl` (100 rows, EVAL-7).
