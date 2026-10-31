import hashlib
import math
import time
from datetime import UTC, date, datetime, timedelta
from typing import Protocol

import httpx


def hash_key(ip: str, salt: str = "") -> str:
    """PRIV-3: salted, UTC-daily-rotated hash, never the raw IP (D32: sha256(date:salt:ip), equivalent
    to the ARCH §8 HMAC/HKDF wording for a whole-digest key; doc updated to match)."""
    return hashlib.sha256(f"{datetime.now(UTC).date().isoformat()}:{salt}:{ip}".encode()).hexdigest()


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


class CounterStore(Protocol):
    """Async counter backend shared by rate limits and the spend cap (ARCH §8/§9). Async so Supabase HTTP never blocks the event loop."""

    async def incr(
        self, bucket: str, count: int = 0, cents: float = 0.0, expires_at: datetime | None = None
    ) -> tuple[int, float]: ...

    async def get(self, bucket: str) -> tuple[int, float]: ...

    async def purge_expired(self, now: datetime) -> int: ...


class InMemoryCounterStore:
    def __init__(self) -> None:
        self._rows: dict[str, tuple[int, float, datetime | None]] = {}

    async def incr(
        self, bucket: str, count: int = 0, cents: float = 0.0, expires_at: datetime | None = None
    ) -> tuple[int, float]:
        old_count, old_cents, old_expires = self._rows.get(bucket, (0, 0.0, None))
        value = (old_count + count, old_cents + cents, expires_at or old_expires)
        self._rows[bucket] = value
        return value[0], value[1]

    async def get(self, bucket: str) -> tuple[int, float]:
        count, cents, _ = self._rows.get(bucket, (0, 0.0, None))
        return count, cents

    async def purge_expired(self, now: datetime) -> int:
        expired = [b for b, (_, _, exp) in self._rows.items() if exp is not None and exp < now]
        for bucket in expired:
            del self._rows[bucket]
        return len(expired)


class SupabaseCounterStore:
    """PostgREST counters; service-role key stays server-side (PRIV-11)."""

    def __init__(self, supabase_url: str, service_role_key: str, client: httpx.AsyncClient | None = None) -> None:
        self._url = supabase_url.rstrip("/")
        self._headers = {"apikey": service_role_key, "Authorization": f"Bearer {service_role_key}"}
        self._client = client or httpx.AsyncClient(timeout=10)

    async def incr(
        self, bucket: str, count: int = 0, cents: float = 0.0, expires_at: datetime | None = None
    ) -> tuple[int, float]:
        body = {
            "p_bucket": bucket,
            "p_count": count,
            "p_cents": cents,
            "p_expires_at": expires_at.isoformat() if expires_at else None,
        }
        res = await self._client.post(f"{self._url}/rest/v1/rpc/increment_counter", json=body, headers=self._headers)
        res.raise_for_status()
        data = res.json()
        row = data[0] if isinstance(data, list) else data
        return int(row["count"]), float(row["cents"])

    async def get(self, bucket: str) -> tuple[int, float]:
        res = await self._client.get(
            f"{self._url}/rest/v1/usage_counters",
            params={"bucket": f"eq.{bucket}", "select": "count,cents"},
            headers=self._headers,
        )
        res.raise_for_status()
        rows = res.json()
        if not rows:
            return 0, 0.0
        return int(rows[0]["count"]), float(rows[0]["cents"])

    async def purge_expired(self, now: datetime) -> int:
        res = await self._client.delete(
            f"{self._url}/rest/v1/usage_counters",
            params={"expires_at": f"lt.{now.isoformat()}"},
            headers={**self._headers, "Prefer": "return=representation"},
        )
        res.raise_for_status()
        return len(res.json())


class SupabaseRateLimiter:
    def __init__(self, counter: CounterStore) -> None:
        self._counter = counter

    async def check(self, key: str, limit: int, window_s: int) -> bool:
        expires = datetime.now(UTC) + timedelta(seconds=window_s)
        count, _ = await self._counter.incr(key, 1, 0.0, expires)
        if count > limit:
            await self._counter.incr(key, -1, 0.0, expires)
            return False
        return True

    def retry_after_s(self, key: str, window_s: int) -> int:
        # shortcut: CounterStore has no TTL read, so wait out the whole window; add a TTL get if clients complain.
        return window_s


class SupabaseSpendCap:
    """Same semantics as InMemorySpendCap: one cents value per bucket holds recorded + reserved."""

    def __init__(self, counter: CounterStore) -> None:
        self._counter = counter

    @staticmethod
    def _buckets() -> tuple[str, str]:
        return f"spend:{date.today().isoformat()}", "spend:total"

    async def check(self, daily_cap_usd: float, total_cap_usd: float) -> bool:
        day_bucket, total_bucket = self._buckets()
        _, day_cents = await self._counter.get(day_bucket)
        _, total_cents = await self._counter.get(total_bucket)
        return day_cents < daily_cap_usd * 100 and total_cents < total_cap_usd * 100

    async def _incr(self, cents: float) -> tuple[float, float]:
        # Daily bucket may be purged after 48 h (ARCH §8); the total cap bucket must outlive the demo.
        day_bucket, total_bucket = self._buckets()
        now = datetime.now(UTC)
        _, day_cents = await self._counter.incr(day_bucket, 0, cents, now + timedelta(hours=48))
        _, total_cents = await self._counter.incr(total_bucket, 0, cents, now + timedelta(days=3650))
        return day_cents, total_cents

    async def reserve(self, amount_usd: float, daily_cap_usd: float, total_cap_usd: float) -> bool:
        cents = amount_usd * 100
        day_cents, total_cents = await self._incr(cents)
        if day_cents > daily_cap_usd * 100 or total_cents > total_cap_usd * 100:
            await self._incr(-cents)
            return False
        return True

    async def reconcile(self, reserved_usd: float, actual_cost_usd: float) -> None:
        delta = (actual_cost_usd - reserved_usd) * 100
        if delta:
            await self._incr(delta)

    async def record(self, cost_usd: float) -> None:
        if cost_usd:
            await self._incr(cost_usd * 100)
