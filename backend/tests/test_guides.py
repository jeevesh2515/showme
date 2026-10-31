import asyncio
import json
import secrets
from datetime import UTC, datetime, timedelta

import httpx
import pytest
import respx

from showme.api.guides import (
    GuideRecord,
    GuideStepIn,
    InMemoryGuideStore,
    SupabaseGuideStore,
    hash_secret,
    new_delete_key,
    new_token,
    purge_expired,
)
from showme.core.schema import PointPx

NOW = datetime(2026, 10, 31, 12, 0, tzinfo=UTC)
SUPABASE = "https://proj.supabase.co"


def make_record(
    expires_at: datetime, image_path: str | None = "guide-1/1.jpg", token: str = "raw-token"
) -> GuideRecord:
    return GuideRecord(
        id="guide-1",
        token_hash=hash_secret(token),
        delete_key_hash=hash_secret("raw-delete-key"),
        goal="cancel my subscription",
        steps=[
            {
                "n": 1,
                "instruction": "Tap your profile picture.",
                "target": None,
                "svg_path": None,
                "svg_origin": None,
                "width": 100,
                "height": 100,
                "image_path": image_path,
            }
        ],
        created_at=NOW,
        expires_at=expires_at,
    )


def test_priv_5_token_stored_hashed_only() -> None:
    token = new_token()
    record = make_record(NOW + timedelta(days=7))
    record.token_hash = hash_secret(token)

    async def run() -> None:
        store = InMemoryGuideStore()
        await store.put(record)
        stored = await store.get(hash_secret(token))
        assert stored is not None and stored.token_hash == record.token_hash
        # Raw token appears nowhere in what would be written to Postgres.
        assert token not in json.dumps(stored.to_row())

    asyncio.run(run())
    assert len(token) == 22 and len(hash_secret(token)) == 64


def test_priv_5_delete_key_hashed_and_verifies() -> None:
    delete_key = new_delete_key()
    record = make_record(NOW + timedelta(days=7))
    record.delete_key_hash = hash_secret(delete_key)
    row = record.to_row()
    assert delete_key not in json.dumps(row)
    assert secrets.compare_digest(row["delete_key_hash"], hash_secret(delete_key))
    assert not secrets.compare_digest(row["delete_key_hash"], hash_secret(delete_key + "x"))


def test_priv_5_expired_guide_not_returned() -> None:
    expired = make_record(NOW - timedelta(seconds=1))
    fresh = make_record(NOW + timedelta(days=1), token="fresh-token")

    async def run() -> None:
        store = InMemoryGuideStore()
        await store.put(expired)
        await store.put(fresh)
        assert expired.expires_at < NOW
        assert await store.list_expired(NOW) == [expired]
        assert await purge_expired(store, NOW) == 1
        assert await store.get(expired.token_hash) is None
        assert await store.get(fresh.token_hash) is not None

    asyncio.run(run())


def test_priv_5_purge_removes_storage_objects() -> None:
    record = make_record(NOW - timedelta(days=1))

    async def run() -> None:
        store = InMemoryGuideStore()
        await store.put(record)
        await store.put_image("guide-1/1.jpg", b"jpeg-bytes", "image/jpeg")
        assert await purge_expired(store, NOW) == 1
        assert await store.get(record.token_hash) is None
        with pytest.raises(KeyError):
            await store.signed_url("guide-1/1.jpg", NOW + timedelta(minutes=10), NOW)

    asyncio.run(run())


def test_priv_5_signed_url_expiry_capped_600() -> None:
    async def run() -> None:
        with respx.mock(base_url=SUPABASE) as mock:
            route = mock.post("/storage/v1/object/sign/guides/guide-1/1.jpg").mock(
                return_value=httpx.Response(200, json={"signedURL": "/object/sign/guides/guide-1/1.jpg?token=t"})
            )
            store = SupabaseGuideStore(SUPABASE, "service-role-key")
            long_lived = await store.signed_url("guide-1/1.jpg", NOW + timedelta(days=1), NOW)
            short_lived = await store.signed_url("guide-1/1.jpg", NOW + timedelta(seconds=60), NOW)

            assert long_lived == f"{SUPABASE}/storage/v1/object/sign/guides/guide-1/1.jpg?token=t"
            assert short_lived == long_lived
            sent = [json.loads(call.request.content)["expiresIn"] for call in route.calls]
            assert sent == [600, 60]
            assert all(value <= 600 for value in sent)

    asyncio.run(run())


def test_priv_5_purge_keeps_row_when_image_delete_fails() -> None:
    async def run() -> None:
        store = InMemoryGuideStore()
        record = make_record(NOW - timedelta(seconds=1))
        await store.put(record)
        await store.put_image("guide-1/1.jpg", b"jpeg-bytes", "image/jpeg")

        async def _fail(path: str) -> None:
            raise RuntimeError("storage down")

        store.delete_image = _fail  # type: ignore[method-assign]
        assert await purge_expired(store, NOW) == 0
        assert await store.get(record.token_hash) is not None  # kept for next run (review F3)

    asyncio.run(run())


def test_priv_5_delete_image_uses_bulk_storage_route() -> None:
    async def run() -> None:
        with respx.mock(base_url=SUPABASE) as mock:
            route = mock.delete("/storage/v1/object/guides").mock(
                return_value=httpx.Response(200, json=[{"name": "1.jpg"}])
            )
            store = SupabaseGuideStore(SUPABASE, "service-role-key")
            await store.delete_image("guide-1/1.jpg")
            assert route.called
            assert json.loads(route.calls.last.request.content) == {"prefixes": ["guide-1/1.jpg"]}

    asyncio.run(run())


def test_priv_5_step_svg_origin_roundtrip() -> None:
    step = GuideStepIn(
        n=1,
        instruction="Tap Save.",
        image="data:image/jpeg;base64,AA==",
        svg_path="M0 0L1 1Z",
        svg_origin=PointPx(x=10, y=20),
        width=100,
        height=100,
    )
    stored = step.model_dump(exclude={"image"}) | {"image_path": "guide-1/1.jpg"}
    assert stored["svg_origin"] == {"x": 10, "y": 20}
    record = make_record(NOW + timedelta(days=1))
    record.steps = [stored]
    restored = GuideRecord.from_row(record.to_row())
    assert restored.steps[0]["svg_origin"] == {"x": 10, "y": 20}
