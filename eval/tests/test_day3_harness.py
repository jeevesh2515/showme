"""Day 3 (EVAL-3..7): stratified Pro sample, negatives, calibration, SAM IoU, RESULTS.md."""

from pathlib import Path

from showme_eval.datasets import Sample, build_negatives, stratified_sample
from showme_eval.metrics import auroc, choose_tau, iou, reliability_bins


def _samples() -> list[Sample]:
    out = []
    i = 0
    for group in ("CAD", "Dev", "Office"):
        for ui in ("text", "icon"):
            for _ in range(20):
                out.append(
                    Sample(
                        id=f"s{i}",
                        instruction=f"click thing {i}",
                        image_path=Path(f"{group}-{ui}-{i}.png"),
                        bbox_xyxy_px=(0.0, 0.0, 10.0, 10.0),
                        width=100,
                        height=100,
                        platform="windows",
                        element_type=ui,
                        group=group,
                    )
                )
                i += 1
    return out


def test_eval_3_stratified_sample_deterministic_and_covers_strata():
    samples = _samples()
    a = stratified_sample(samples, 30, seed=0)
    b = stratified_sample(samples, 30, seed=0)
    assert [s.id for s in a] == [s.id for s in b]
    assert len({s.id for s in a}) == 30
    assert {(s.group, s.element_type) for s in a} == {
        (s.group, s.element_type) for s in samples
    }


def test_eval_6_negatives_pair_instruction_with_different_app_image():
    samples = _samples()
    negs = build_negatives(samples, 20, seed=0)
    by_id = {s.id: s for s in samples}
    assert len(negs) == 20
    for neg in negs:
        assert neg.expected_status == "not_visible"
        source = next(s for s in samples if s.instruction == neg.instruction)
        assert neg.image_path != source.image_path
        assert by_id  # silence linter-style unused


def test_eval_6_auroc_perfect_and_reversed():
    assert auroc([(0.9, True), (0.8, True), (0.2, False), (0.1, False)]) == 1.0
    assert auroc([(0.1, True), (0.9, False)]) == 0.0
    assert auroc([(0.5, True), (0.5, False)]) == 0.5


def test_eval_6_reliability_bins_and_tau():
    preds = [
        {"confidence": 0.95, "hit": True, "raw_status": "ok"},
        {"confidence": 0.96, "hit": True, "raw_status": "ok"},
        {"confidence": 0.55, "hit": False, "raw_status": "ok"},
        {"confidence": 0.99, "hit": False, "raw_status": "not_visible"},
    ]
    bins = reliability_bins(preds, n_bins=2)
    assert sum(b["n"] for b in bins) == 4
    # smallest tau with >=95% precision on raw-ok steps: only tau<=0.95 keeps both hits + the 0.55 miss -> precision 2/3; tau in (0.55,0.95] gives 2/2
    assert choose_tau(preds) == 0.95
    assert choose_tau([{"confidence": 0.9, "hit": False, "raw_status": "ok"}]) is None


def test_eval_4_iou():
    assert iou((0, 0, 10, 10), (0, 0, 10, 10)) == 1.0
    assert iou((0, 0, 10, 10), (20, 20, 30, 30)) == 0.0
    assert abs(iou((0, 0, 10, 10), (5, 0, 15, 10)) - 1 / 3) < 1e-9


def test_eval_7_results_md_generated_from_summaries(tmp_path):
    from showme_eval.report import write_results_md

    run = tmp_path / "2026-10-29-screenspot-v2-x"
    run.mkdir()
    (run / "predictions.jsonl").write_text("{}\n")
    (run / "summary.json").write_text(
        '{"suite":"screenspot-v2","model":"muse-spark-1.3","effort":"minimal","n":10,"hits":9,"accuracy":0.9,"date":"2026-10-29","split":"heldout"}'
    )
    out = write_results_md(tmp_path)
    text = out.read_text()
    assert "90.0%" in text and "predictions.jsonl" in text and "screenspot-v2" in text
