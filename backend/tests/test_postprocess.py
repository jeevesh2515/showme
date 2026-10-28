import pytest

from showme.core.postprocess import postprocess
from showme.core.schema import BBox, ModelOutput, Point


def raw(**kw):
    d = {
        "status": "ok",
        "action": "tap",
        "instruction": "Tap Save.",
        "target_label": "Save",
        "point": Point(x=500, y=500),
        "bbox": BBox(x_min=400, y_min=400, x_max=600, y_max=600),
        "scroll_direction": "none",
        "type_text": "",
        "confidence": 0.9,
        "caution": "",
        "reason": "",
    }
    d.update(kw)
    return ModelOutput(**d)


def test_api_3_clamps_1001():
    r = postprocess(
        raw(point=Point(x=1001, y=1001), bbox=BBox(x_min=0, y_min=0, x_max=1001, y_max=1001)), 1000, 1000, 0.5
    )
    assert r.target and r.target.box.x2 == 1000 and r.target.point.x <= 1000


def test_api_3_inverted_box_normalised_and_point_fixed_to_centre():
    r = postprocess(
        raw(point=Point(x=10, y=10), bbox=BBox(x_min=600, y_min=600, x_max=400, y_max=400)), 1000, 1000, 0.5
    )
    assert r.target and (r.target.box.x1, r.target.box.x2) == (400, 600)
    assert r.point_fixed and (r.target.point.x, r.target.point.y) == (500, 500)


def test_api_3_converts_to_pixels():
    r = postprocess(raw(), 1280, 800, 0.5)
    assert r.target and (r.target.point.x, r.target.point.y) == (640, 400)
    assert (r.target.box.x1, r.target.box.y2) == (512, 480)


@pytest.mark.parametrize("status,complete", [("not_visible", False), ("done", True), ("refuse", False)])
def test_api_3_non_ok_status_has_no_target(status, complete):
    r = postprocess(raw(status=status), 1000, 1000, 0.5)
    assert r.target is None and r.goal_complete is complete


def test_api_3_degenerate_box_downgrades_to_unsure():
    tiny = postprocess(
        raw(bbox=BBox(x_min=500, y_min=500, x_max=501, y_max=501), point=Point(x=500, y=500)), 1000, 1000, 0.5
    )
    assert tiny.status == "unsure"
    huge = postprocess(raw(bbox=BBox(x_min=0, y_min=0, x_max=1000, y_max=1000)), 1000, 1000, 0.5)
    assert huge.status == "unsure"


def test_api_3_low_confidence_downgrades_to_unsure():
    assert postprocess(raw(confidence=0.4), 1000, 1000, 0.5).status == "unsure"
    assert postprocess(raw(confidence=0.9), 1000, 1000, 0.5).status == "ok"


def test_priv_7_type_text_pii_emptied_and_instruction_capped():
    r = postprocess(raw(type_text="mail me at a@b.co.uk", instruction="**Tap** " + "x" * 300), 1000, 1000, 0.5)
    assert r.type_text == "" and len(r.instruction) <= 200 and "*" not in r.instruction


def test_api_3_unsure_keeps_target():
    r = postprocess(raw(status="unsure"), 1000, 1000, 0.5)
    assert r.status == "unsure" and r.target is not None


def test_api_3_point_outside_normal_box_moves_to_centre():
    r = postprocess(raw(point=Point(x=10, y=10)), 1000, 1000, 0.5)
    assert r.point_fixed and (r.target.point.x, r.target.point.y) == (500, 500)


def test_api_3_clamps_y_and_y2_exactly():
    r = postprocess(
        raw(point=Point(x=500, y=1001), bbox=BBox(x_min=0, y_min=0, x_max=500, y_max=1001)), 1000, 1000, 0.5
    )
    assert r.target.box.y2 == 1000 and r.target.point.y == 1000
