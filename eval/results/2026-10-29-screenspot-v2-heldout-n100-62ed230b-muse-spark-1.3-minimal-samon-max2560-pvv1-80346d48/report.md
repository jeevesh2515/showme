# screenspot-v2 · muse-spark-1.3 · minimal · SAM on

- Date: 2026-10-29
- Split: **heldout**
- Accuracy: **90/100 = 90.0%**
- Latency p50/p95: 2362.0 / 3053.35 ms
- Cost: $0.2450
- Prompt version: v1 · git 2582af6
- Preprocessing: production path (RGB, long side <= 2560, JPEG q=0.85); images are public benchmarks, not redacted.

## By platform

| platform | n | hits | accuracy |
| --- | --- | --- | --- |
| desktop | 27 | 23 | 85.2% |
| mobile | 39 | 37 | 94.9% |
| web | 34 | 30 | 88.2% |

## By element type

| type | n | hits | accuracy |
| --- | --- | --- | --- |
| icon | 50 | 46 | 92.0% |
| text | 50 | 44 | 88.0% |

## By group

| group | n | hits | accuracy |
| --- | --- | --- | --- |
| android | 16 | 16 | 100.0% |
| forum | 8 | 6 | 75.0% |
| gitlab | 7 | 6 | 85.7% |
| ios | 21 | 19 | 90.5% |
| macos | 13 | 11 | 84.6% |
| shop | 15 | 14 | 93.3% |
| tool | 8 | 8 | 100.0% |
| windows | 12 | 10 | 83.3% |

## By status

| status | n | hits | accuracy |
| --- | --- | --- | --- |
| done | 2 | 0 | 0.0% |
| ok | 98 | 90 | 91.8% |

## SAM ablation (EVAL-4)

- Gate pass: 86/98 = 87.8%; box fallback for the rest.
- Mean IoU model box: 0.556; SAM agreement-gated: 0.5145424122205402
- SAM IoU better than model box on 20 gated samples.
- Click accuracy above is unchanged by SAM by design: SAM never moves the click point.


Raw predictions: `predictions.jsonl` (100 rows, EVAL-7).
