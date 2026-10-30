from showme.api.main import client_ip


class R:
    def __init__(self, headers, host="10.0.0.1"):
        self.headers = headers
        self.client = type("C", (), {"host": host})()


def test_api_6_vercel_real_ip_wins_over_spoofable_xff(monkeypatch):
    monkeypatch.setenv("VERCEL", "1")
    assert client_ip(R({"x-real-ip": "1.2.3.4", "x-forwarded-for": "9.9.9.9"})) == "1.2.3.4"


def test_api_6_spoofed_xff_alone_does_not_change_key(monkeypatch):
    monkeypatch.delenv("VERCEL", raising=False)
    assert client_ip(R({"x-forwarded-for": "9.9.9.9", "x-real-ip": "9.9.9.9"})) == "10.0.0.1"
