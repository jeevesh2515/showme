# Blind SAM vs model-box rating

Status: **ratings not run**. 20 pairs are ready: production SAM ran on stored e2e boxes (`refine_pairs.py`, 25 calls, $0.0625, 5 rejected by the gate, recorded in `eval/results/spend.json`).

Run (Node 22, no deps):
1. `node eval/highlight_rating/build.mjs` writes `sample.json` (the key, do not open while rating) and `rate.html`.
2. Open `eval/highlight_rating/rate.html` in a browser (file://; images load by relative path from `eval/results/`). Press 1-4: A better, B better, about the same, both wrong. Progress is kept in localStorage. Download `ratings.csv` at the end.
3. `node eval/highlight_rating/score.mjs path/to/ratings.csv` unblinds and writes `summary.json` (add `--partial` to score an incomplete set).
4. Tests: `node --test eval/highlight_rating/build.test.mjs`.

Not fully blind: labels and sides are hidden, but a rectangle is recognisable next to an irregular outline, and `rate.html` holds the geometry in its source. The pairs also exclude the 5 steps where the gate kept the box, because no outline was shown for them.

Honest wording for publication: "SAM ran on stored boxes from the 2026-11-02 e2e run in sha256 order of seed showme-rating-2026-11-02 and task:step, until 20 passed the agreement gate (25 calls, 5 rejected). One rater, the founder, compared each outline with the model box, sides randomised, method labels hidden. Shape can reveal the method and the rater knows the product, so this is one person's preference. Counts only, no significance claimed."

Geometry is measured separately: on 86 gated ScreenSpot-v2 samples (prompt v1), mean IoU was 0.5145 for SAM and 0.5596 for the model box. This rating checks only human preference.
