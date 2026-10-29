import hashlib
import math
import time
from datetime import date


def hash_key(ip: str, salt: str = "") -> str:
    """PRIV-3: salted, daily-rotated hash, never the raw IP; in memory only until Day 5 Supabase."""
    return hashlib.sha256(f"{date.today().isoformat()}:{salt}:{ip}".encode()).hexdigest()


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = {}

    def check(self, key: str, limit: int, window_s: int) -> bool:
        now = time.time()
        hits = [t for t in self._hits.get(key, []) if now - t < window_s]
        if len(hits) >= limit:
            self._hits[key] = hits
            return False
        hits.append(now)
        self._hits[key] = hits
        return True

    def retry_after_s(self, key: str, window_s: int) -> int:
        hits = self._hits.get(key) or []
        if not hits:
            return 0
        return max(1, math.ceil(window_s - (time.time() - min(hits))))


class InMemorySpendCap:
    def __init__(self) -> None:
        self._day = date.today()
        self._day_total = 0.0
        self._total = 0.0
        self._reserved_day = 0.0
        self._reserved_total = 0.0

    def _rollover(self) -> None:
        today = date.today()
        if today != self._day:
            self._day = today
            self._day_total = 0.0
            self._reserved_day = 0.0

    def check(self, daily_cap_usd: float, total_cap_usd: float) -> bool:
        self._rollover()
        return (self._day_total + self._reserved_day) < daily_cap_usd and (
            self._total + self._reserved_total
        ) < total_cap_usd

    def reserve(self, amount_usd: float, daily_cap_usd: float, total_cap_usd: float) -> bool:
        """Atomically reserve a conservative budget for an in-flight request (review 2026-10-29 #2)."""
        self._rollover()
        if (self._day_total + self._reserved_day + amount_usd) > daily_cap_usd or (
            self._total + self._reserved_total + amount_usd
        ) > total_cap_usd:
            return False
        self._reserved_day += amount_usd
        self._reserved_total += amount_usd
        return True

    def reconcile(self, reserved_usd: float, actual_cost_usd: float) -> None:
        """Release reservation and record actual cost incurred."""
        self._rollover()
        self._reserved_day = max(0.0, self._reserved_day - reserved_usd)
        self._reserved_total = max(0.0, self._reserved_total - reserved_usd)
        self._day_total += actual_cost_usd
        self._total += actual_cost_usd

    def record(self, cost_usd: float) -> None:
        self._rollover()
        self._day_total += cost_usd
        self._total += cost_usd
