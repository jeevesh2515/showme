from showme.api.main import client_ip


class R:
    def __init__(self, headers, host="10.0.0.1"):
        self.headers = headers
        self.client = type("C", (), {"host": host})()


def test_api_6_vercel_forwarded_for_wins_over_spoofable_headers(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    # 2026-10-31 review S1: only x-vercel-forwarded-for is trusted; client-sent x-real-ip is ignored.
    assert client_ip(R({"x-vercel-forwarded-for": "1.2.3.4, 5.6.7.8", "x-real-ip": "9.9.9.9"})) == "1.2.3.4"
    assert client_ip(R({"x-real-ip": "9.9.9.9"})) == "10.0.0.1"


def test_api_6_spoofed_xff_alone_does_not_change_key(monkeypatch):
    monkeypatch.delenv("VERCEL", raising=False)
    assert client_ip(R({"x-forwarded-for": "9.9.9.9", "x-real-ip": "9.9.9.9"})) == "10.0.0.1"
