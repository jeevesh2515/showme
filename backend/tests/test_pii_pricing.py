from showme.core.pii import contains_pii, mask_pii
from showme.core.pricing import cost_ground, cost_sam


def test_priv_7_mask_pii_patterns():
    assert mask_pii("email a@b.co.uk now") == "email [hidden] now"
    assert contains_pii("call +44 7700 900123")
    assert contains_pii("card 4242 4242 4242 4242")  # Luhn-valid test card
    assert not contains_pii("card 4242 4242 4242 4241")  # Luhn fails, <8-run after spaces not masked as card
    assert contains_pii("postcode SW1A 1AA")
    assert contains_pii("ref 12345678")
    assert mask_pii("nothing private") == "nothing private"


def test_api_7_pricing_from_usage():
    assert abs(cost_ground("muse-spark-1.3", 1_000_000, 1_000_000) - 5.50) < 1e-9
    assert cost_sam() == 0.0025
    assert cost_ground("unknown", 10, 10) == 0.0
