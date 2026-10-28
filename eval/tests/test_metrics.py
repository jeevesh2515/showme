from showme_eval.metrics import breakdown, percentile, point_in_box, summary

BOX = (10.0, 20.0, 100.0, 200.0)


def test_eval_2_point_inside_ground_truth_box():
    assert point_in_box((50, 100), BOX)
    assert point_in_box((10, 20), BOX)  # edge counts
    assert not point_in_box((9, 100), BOX)
    assert not point_in_box((50, 201), BOX)


def test_percentile_interpolates_and_handles_empty():
    assert percentile([], 50) is None
    assert percentile([10, 20, 30], 50) == 20
    assert percentile([0, 10], 95) == 9.5


def test_breakdown_and_summary_report_accuracy_by_key():
    predictions = [
        {
            "platform": "mobile",
            "element_type": "icon",
            "hit": True,
            "latency_ms": 100,
            "cost_usd": 0.01,
        },
        {
            "platform": "mobile",
            "element_type": "text",
            "hit": False,
            "latency_ms": 300,
            "cost_usd": 0.01,
        },
        {
            "platform": "web",
            "element_type": "icon",
            "hit": True,
            "latency_ms": 200,
            "cost_usd": 0.01,
        },
    ]
    result = summary(predictions)

    assert result["accuracy"] == 2 / 3
    assert breakdown(predictions, "platform")["mobile"] == {
        "n": 2,
        "hits": 1,
        "accuracy": 0.5,
    }
    assert result["by_element_type"]["icon"]["accuracy"] == 1.0
    assert result["latency_p50_ms"] == 200
    assert result["latency_p95_ms"] == 290
    assert result["total_cost_usd"] == 0.03


def test_summary_handles_zero_predictions():
    result = summary([])
    assert result["n"] == 0 and result["accuracy"] == 0.0
    assert result["latency_p50_ms"] is None
