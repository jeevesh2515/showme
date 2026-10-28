import json

from showme_eval.report import update_spend, write_run

META = {
    "suite": "screenspot-v2",
    "model": "muse-spark-1.3",
    "effort": "minimal",
    "sam_on": False,
    "split": "dev",
    "is_headline": False,
    "prompt_version": "v1",
}
PREDICTIONS = [
    {
        "platform": "web",
        "element_type": "text",
        "hit": True,
        "latency_ms": 1200,
        "cost_usd": 0.0051,
    },
    {
        "platform": "web",
        "element_type": "icon",
        "hit": False,
        "latency_ms": 1800,
        "cost_usd": 0.0051,
    },
]


def test_eval_7_write_run_emits_all_artefacts(tmp_path):
    result = write_run(tmp_path / "run", PREDICTIONS, META)

    assert (tmp_path / "run" / "predictions.jsonl").read_text().count("\n") == 2
    summary = json.loads((tmp_path / "run" / "summary.json").read_text())
    assert summary["accuracy"] == 0.5
    assert summary["git_sha"] != ""
    report = (tmp_path / "run" / "report.md").read_text()
    assert "not** a headline number" in report
    assert result["total_cost_usd"] == 0.0102


def test_spend_json_accumulates_runs(tmp_path):
    update_spend(tmp_path, 0.01, label="a")
    data = update_spend(tmp_path, 0.02, label="b")
    assert data["total_usd"] == 0.03
    assert [run["label"] for run in data["runs"]] == ["a", "b"]


def test_eval_7_report_links_predictions_file(tmp_path):
    preds = [dict(PREDICTIONS[0], response={"status": "ok"})]
    write_run(tmp_path, preds, META)
    report = (tmp_path / "report.md").read_text()
    assert "predictions.jsonl" in report
    rows = [
        json.loads(line)
        for line in (tmp_path / "predictions.jsonl").read_text().splitlines()
    ]
    assert rows and "response" in rows[0]
