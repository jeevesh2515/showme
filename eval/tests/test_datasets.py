import json

from PIL import Image
from showme_eval.datasets import (
    dev_split,
    draw_debug,
    heldout_split,
    load_pro_local,
    load_v2_local,
    xywh_to_xyxy,
)


def _image(path, size=(200, 100)):
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGB", size, "white").save(path)


def test_eval_2_v2_xywh_becomes_absolute_xyxy():
    assert xywh_to_xyxy([223, 78, 601, 593]) == (223.0, 78.0, 824.0, 671.0)


def test_eval_2_v2_loader_reads_annotation(tmp_path):
    _image(tmp_path / "images" / "mobile_1.png", (1080, 1920))
    rows = [
        {
            "img_filename": "mobile_1.png",
            "bbox": [223, 78, 601, 593],
            "instruction": "check the weather",
            "data_type": "icon",
            "data_source": "ios",
        }
    ]
    (tmp_path / "screenspot_mobile_v2.json").write_text(json.dumps(rows))

    [sample] = load_v2_local(tmp_path)

    assert sample.bbox_xyxy_px == (223.0, 78.0, 824.0, 671.0)
    assert (sample.platform, sample.element_type, sample.group) == (
        "mobile",
        "icon",
        "ios",
    )
    assert (sample.width, sample.height) == (1080, 1920)
    assert sample.image_path.name == "mobile_1.png"


def test_eval_2_pro_loader_passes_xyxy_through(tmp_path):
    _image(tmp_path / "images" / "autocad" / "shot.png", (3840, 1080))
    rows = [
        {
            "img_filename": "autocad/shot.png",
            "bbox": [91, 278, 172, 310],
            "instruction": "Hand-draw cloud line",
            "id": "autocad_windows_0",
            "platform": "windows",
            "img_size": [3840, 1080],
            "ui_type": "text",
            "group": "CAD",
        }
    ]
    (tmp_path / "annotations").mkdir()
    (tmp_path / "annotations" / "autocad_windows.json").write_text(json.dumps(rows))

    [sample] = load_pro_local(tmp_path)

    assert sample.bbox_xyxy_px == (91.0, 278.0, 172.0, 310.0)
    assert sample.id == "autocad_windows_0"
    assert (sample.platform, sample.element_type, sample.group) == (
        "windows",
        "text",
        "CAD",
    )
    assert (sample.width, sample.height) == (3840, 1080)


def test_dev_split_seed_is_deterministic_and_exact_size():
    samples = list(range(300))
    first = dev_split(samples, seed=0, n=100)
    second = dev_split(samples, seed=0, n=100)
    assert first == second
    assert len(first) == 100
    assert len(set(first)) == 100


def test_dev_and_heldout_are_disjoint_and_cover_everything():
    samples = list(range(300))
    dev = dev_split(samples, seed=0, n=100)
    heldout = heldout_split(samples, seed=0, n_dev=100)
    assert not set(dev) & set(heldout)
    assert sorted(dev + heldout) == samples


def test_draw_debug_writes_limit_images(tmp_path):
    from showme_eval.datasets import Sample

    samples = []
    for i in range(3):
        path = tmp_path / f"{i}.png"
        _image(path)
        samples.append(
            Sample(
                f"s{i}", "goal", path, (10.0, 10.0, 50.0, 40.0), 200, 100, "web", "text"
            )
        )
    written = draw_debug(samples, tmp_path / "debug", limit=2)
    assert len(written) == 2 and all(path.exists() for path in written)


def _fake_samples(count=250):
    from pathlib import Path as _P

    from showme_eval.datasets import Sample

    return [
        Sample(
            id=f"s{i}",
            instruction="x",
            image_path=_P("x.png"),
            bbox_xyxy_px=(0, 0, 1, 1),
            width=10,
            height=10,
            platform="web",
            element_type="text",
        )
        for i in range(count)
    ]


def test_eval_9_partitions_disjoint_for_all_n():
    from showme_eval.datasets import select_partition

    samples = _fake_samples()
    held = {s.id for s in select_partition(samples, "heldout")}
    for n in (1, 10, 50, 100):
        dev = {s.id for s in select_partition(samples, "dev", n=n)}
        assert dev and not dev & held
    assert len({s.id for s in select_partition(samples, "dev")}) == 100


def test_eval_9_invalid_n_rejected():
    import pytest
    from showme_eval.datasets import select_partition

    samples = _fake_samples()
    with pytest.raises(ValueError):
        select_partition(samples, "dev", n=300)
    with pytest.raises(ValueError):
        select_partition(samples, "heldout", n=10_000)
    with pytest.raises(ValueError):
        select_partition(samples, "dev", n=0)


def test_eval_6_build_negatives_rejects_partner_with_same_control():
    from pathlib import Path as _P

    from showme_eval.datasets import Sample, build_negatives

    s1 = Sample(
        id="s1",
        instruction="turn on bold lettering",
        image_path=_P("app1.png"),
        bbox_xyxy_px=(10, 10, 50, 50),
        width=100,
        height=100,
        platform="mobile",
        element_type="switch",
        group="app1",
    )
    s2 = Sample(
        id="s2",
        instruction="bold text toggle",
        image_path=_P("app2.png"),
        bbox_xyxy_px=(10, 10, 50, 50),
        width=100,
        height=100,
        platform="mobile",
        element_type="switch",
        group="app2",
    )
    s3 = Sample(
        id="s3",
        instruction="refresh feed",
        image_path=_P("app3.png"),
        bbox_xyxy_px=(10, 10, 50, 50),
        width=100,
        height=100,
        platform="mobile",
        element_type="button",
        group="app3",
    )
    negs = build_negatives([s1, s2, s3], n=1, seed=0)
    assert len(negs) == 1
    for neg in negs:
        if "bold" in neg.instruction:
            assert neg.image_path.name == "app3.png"


def test_eval_6_build_negatives_rejects_audited_invalid_pair():
    from pathlib import Path as _P

    from showme_eval.datasets import Sample, build_negatives

    s1 = Sample(
        id="s1",
        instruction="bold lettering",
        image_path=_P("orig.png"),
        bbox_xyxy_px=(10, 10, 50, 50),
        width=100,
        height=100,
        platform="mobile",
        element_type="text",
        group="group1",
    )
    s2 = Sample(
        id="s2",
        instruction="completely unrelated action",
        image_path=_P("mobile_1152be83-7090-45b9-9465-e5acc02d867d.png"),
        bbox_xyxy_px=(10, 10, 50, 50),
        width=100,
        height=100,
        platform="mobile",
        element_type="text",
        group="group2",
    )
    s3 = Sample(
        id="s3",
        instruction="another action",
        image_path=_P("safe_screen.png"),
        bbox_xyxy_px=(10, 10, 50, 50),
        width=100,
        height=100,
        platform="mobile",
        element_type="text",
        group="group3",
    )
    negs = build_negatives([s1, s2, s3], n=1, seed=0)
    for neg in negs:
        if neg.instruction == "bold lettering":
            assert (
                neg.image_path.name != "mobile_1152be83-7090-45b9-9465-e5acc02d867d.png"
            )
