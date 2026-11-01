from check_doc_paths import check


def test_check_flags_missing_path_and_ignores_url_and_anchor(tmp_path):
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs" / "real.md").write_text("ok")
    (tmp_path / "README.md").write_text(
        "See [real](docs/real.md#top), `docs/gone.md:12` and [site](https://example.com/a.md).\n"
    )
    assert check(tmp_path, ["README.md"]) == ["README.md: docs/gone.md"]
