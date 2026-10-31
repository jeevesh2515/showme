import asyncio
import json
from datetime import UTC, date, datetime, timedelta

import httpx
import pytest
import respx

from showme.api.ratelimit import (
    InMemoryCounterStore,
    SupabaseCounterStore,
    SupabaseRateLimiter,
    SupabaseSpendCap,
)

NOW = datetime(2026, 10, 31, 12, 0, tzinfo=UTC)
SUPABASE = "https://proj.supabase.co"


class FakeCounterStore:
    def __init__(self) -> None:
        self.rows: dict[str, tuple[int, float, datetime | None]] = {}

    async def incr(
        self, bucket: str, count: int = 0, cents: float = 0.0, expires_at: datetime | None = None
    ) -> tuple[int, float]:
        old_count, old_cents, old_expires = self.rows.get(bucket, (0, 0.0, None))
        row = (old_count + count, old_cents + cents, expires_at or old_expires)
        self.rows[bucket] = row
        return row[0], row[1]

    async def get(self, bucket: str) -> tuple[int, float]:
        count, cents, _ = self.rows.get(bucket, (0, 0.0, None))
        return count, cents

    async def purge_expired(self, now: datetime) -> int:
        expired = [b for b, (_, _, exp) in self.rows.items() if exp is not None and exp < now]
        for bucket in expired:
            del self.rows[bucket]
        return len(expired)


def test_api_6_supabase_rate_limiter_blocks_over_limit() -> None:
    async def run() -> None:
        counter = FakeCounterStore()
        limiter = SupabaseRateLimiter(counter)
        assert await limiter.check("3600:ip-hash", 2, 60)
        assert await limiter.check("3600:ip-hash", 2, 60)
        assert not await limiter.check("3600:ip-hash", 2, 60)
        assert (await counter.get("3600:ip-hash"))[0] == 2  # blocked attempt rolled back
        assert limiter.retry_after_s("3600:ip-hash", 60) == 60

    asyncio.run(run())


def test_api_6_supabase_spend_cap_reserve_reconcile() -> None:
    async def run() -> None:
        counter = FakeCounterStore()
        cap = SupabaseSpendCap(counter)
        day = f"spend:{date.today().isoformat()}"

        assert await cap.reserve(0.01, daily_cap_usd=0.02, total_cap_usd=1.0)
        assert not await cap.reserve(0.02, daily_cap_usd=0.02, total_cap_usd=1.0)  # over daily cap
        assert (await counter.get(day))[1] == pytest.approx(1.0, abs=1e-9)  # rollback
        assert await cap.check(0.02, 1.0)

        await cap.reconcile(reserved_usd=0.01, actual_cost_usd=0.004)
        assert (await counter.get(day))[1] == pytest.approx(0.4, abs=1e-9)
        await cap.record(0.001)
        assert (await counter.get("spend:total"))[1] == pytest.approx(0.5, abs=1e-9)
        assert not await cap.check(daily_cap_usd=0.004, total_cap_usd=1.0)

    asyncio.run(run())


def test_api_6_counter_purge_expired() -> None:
    async def run() -> None:
        counter = InMemoryCounterStore()
        await counter.incr("ip:old", 1, expires_at=NOW - timedelta(seconds=1))
        await counter.incr("ip:fresh", 1, expires_at=NOW + timedelta(hours=1))
        await counter.incr("spend:total", 0, 12.5)
        assert await counter.purge_expired(NOW) == 1
        assert await counter.get("ip:old") == (0, 0)
        assert await counter.get("ip:fresh") == (1, 0.0)
        assert await counter.get("spend:total") == (0, 12.5)

    asyncio.run(run())


def test_api_6_supabase_counter_store_http_contract() -> None:
    async def run() -> None:
        with respx.mock(base_url=SUPABASE) as mock:
            rpc = mock.post("/rest/v1/rpc/increment_counter").mock(
                return_value=httpx.Response(200, json=[{"count": 3, "cents": 1.5}])
            )
            get = mock.get("/rest/v1/usage_counters").mock(
                return_value=httpx.Response(200, json=[{"count": 0, "cents": 12.5}])
            )
            delete = mock.delete("/rest/v1/usage_counters").mock(
                return_value=httpx.Response(200, json=[{"bucket": "ip:old"}])
            )

            store = SupabaseCounterStore(SUPABASE, "service-role-key")
            assert await store.incr("spend:total", 1, 2.5, NOW) == (3, 1.5)
            assert await store.get("spend:total") == (0, 12.5)
            assert await store.purge_expired(NOW) == 1

            body = json.loads(rpc.calls.last.request.content)
            assert body == {"p_bucket": "spend:total", "p_count": 1, "p_cents": 2.5, "p_expires_at": NOW.isoformat()}
            assert rpc.calls.last.request.headers["apikey"] == "service-role-key"
            assert get.called and delete.called

    asyncio.run(run())


def test_api_6_supabase_rate_limiter_uses_utc_expiry() -> None:
    async def run() -> None:
        counter = FakeCounterStore()
        await SupabaseRateLimiter(counter).check("bucket", 1, 30)
        _, _, expires_at = counter.rows["bucket"]
        assert expires_at is not None and expires_at.tzinfo is not None

    asyncio.run(run())
