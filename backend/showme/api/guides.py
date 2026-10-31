import base64
import contextlib
import hashlib
import secrets
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Protocol

import httpx
from pydantic import BaseModel, Field

from showme.core.schema import PointPx, Target


class GuideStepIn(BaseModel):
    n: int
    instruction: str = Field(max_length=200)
    image: str
    target: Target | None = None
    svg_path: str | None = Field(default=None, max_length=20_000)  # rendered into <path d>; cap pathological paths
    svg_origin: PointPx | None = None
    width: int
    height: int


class CreateGuideRequest(BaseModel):
    goal: str = Field(min_length=1, max_length=300)
    steps: list[GuideStepIn] = Field(min_length=1, max_length=15)
    consent: bool


class CreateGuideResponse(BaseModel):
    url: str
    delete_key: str
    expires_at: str


class GuideStepOut(BaseModel):
    n: int
    instruction: str
    image_url: str
    target: Target | None = None
    svg_path: str | None = None
    svg_origin: PointPx | None = None
    width: int
    height: int


class GetGuideResponse(BaseModel):
    goal: str
    steps: list[GuideStepOut]
    expires_at: str


def hash_secret(raw: str) -> str:
    """PRIV-5: only hashes of the URL token and delete key are ever stored."""
    return hashlib.sha256(raw.encode()).hexdigest()


def new_token() -> str:
    return secrets.token_urlsafe(16)


def new_delete_key() -> str:
    return secrets.token_urlsafe(24)


def _iso(value: datetime) -> str:
    return value.isoformat()


def _dt(value: str) -> datetime:
    return datetime.fromisoformat(value)


@dataclass
class GuideRecord:
    id: str
    token_hash: str
    delete_key_hash: str
    goal: str
    steps: list[dict[str, Any]]
    created_at: datetime
    expires_at: datetime

    def to_row(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "token_hash": self.token_hash,
            "delete_key_hash": self.delete_key_hash,
            "goal": self.goal,
            "steps": self.steps,
            "created_at": _iso(self.created_at),
            "expires_at": _iso(self.expires_at),
        }

    @classmethod
    def from_row(cls, row: dict[str, Any]) -> "GuideRecord":
        return cls(
            id=str(row["id"]),
            token_hash=row["token_hash"],
            delete_key_hash=row["delete_key_hash"],
            goal=row["goal"],
            steps=list(row["steps"]),
            created_at=_dt(row["created_at"]),
            expires_at=_dt(row["expires_at"]),
        )


class GuideStore(Protocol):
    async def put(self, record: GuideRecord) -> None: ...

    async def get(self, token_hash: str) -> GuideRecord | None: ...

    async def delete(self, token_hash: str) -> GuideRecord | None: ...

    async def list_expired(self, now: datetime) -> list[GuideRecord]: ...

    async def remove(self, token_hash: str) -> None: ...

    async def put_image(self, path: str, data: bytes, content_type: str) -> None: ...

    async def delete_image(self, path: str) -> None: ...

    async def signed_url(self, path: str, expires_at: datetime, now: datetime) -> str: ...


class InMemoryGuideStore:
    def __init__(self) -> None:
        self._guides: dict[str, GuideRecord] = {}
        self._images: dict[str, tuple[bytes, str]] = {}

    async def put(self, record: GuideRecord) -> None:
        self._guides[record.token_hash] = record

    async def get(self, token_hash: str) -> GuideRecord | None:
        return self._guides.get(token_hash)

    async def delete(self, token_hash: str) -> GuideRecord | None:
        return self._guides.pop(token_hash, None)

    async def list_expired(self, now: datetime) -> list[GuideRecord]:
        return [record for record in self._guides.values() if record.expires_at < now]

    async def remove(self, token_hash: str) -> None:
        self._guides.pop(token_hash, None)

    async def put_image(self, path: str, data: bytes, content_type: str) -> None:
        self._images[path] = (data, content_type)

    async def delete_image(self, path: str) -> None:
        self._images.pop(path, None)

    async def signed_url(self, path: str, expires_at: datetime, now: datetime) -> str:
        data, content_type = self._images[path]
        return f"data:{content_type};base64,{base64.b64encode(data).decode()}"


class SupabaseGuideStore:
    """PostgREST guides table + private storage bucket; service-role key stays server-side (PRIV-11)."""

    def __init__(self, supabase_url: str, service_role_key: str, client: httpx.AsyncClient | None = None) -> None:
        self._url = supabase_url.rstrip("/")
        self._headers = {"apikey": service_role_key, "Authorization": f"Bearer {service_role_key}"}
        self._client = client or httpx.AsyncClient(timeout=10)

    async def put(self, record: GuideRecord) -> None:
        res = await self._client.post(
            f"{self._url}/rest/v1/guides", json=record.to_row(), headers={**self._headers, "Prefer": "return=minimal"}
        )
        res.raise_for_status()

    async def get(self, token_hash: str) -> GuideRecord | None:
        res = await self._client.get(
            f"{self._url}/rest/v1/guides",
            params={"token_hash": f"eq.{token_hash}", "select": "*"},
            headers=self._headers,
        )
        res.raise_for_status()
        rows = res.json()
        return GuideRecord.from_row(rows[0]) if rows else None

    async def delete(self, token_hash: str) -> GuideRecord | None:
        res = await self._client.delete(
            f"{self._url}/rest/v1/guides",
            params={"token_hash": f"eq.{token_hash}"},
            headers={**self._headers, "Prefer": "return=representation"},
        )
        res.raise_for_status()
        rows = res.json()
        return GuideRecord.from_row(rows[0]) if rows else None

    async def list_expired(self, now: datetime) -> list[GuideRecord]:
        res = await self._client.get(
            f"{self._url}/rest/v1/guides",
            params={"expires_at": f"lt.{_iso(now)}", "select": "*"},
            headers=self._headers,
        )
        res.raise_for_status()
        return [GuideRecord.from_row(row) for row in res.json()]

    async def remove(self, token_hash: str) -> None:
        res = await self._client.delete(
            f"{self._url}/rest/v1/guides",
            params={"token_hash": f"eq.{token_hash}"},
            headers={**self._headers, "Prefer": "return=minimal"},
        )
        res.raise_for_status()

    async def put_image(self, path: str, data: bytes, content_type: str) -> None:
        res = await self._client.post(
            f"{self._url}/storage/v1/object/guides/{path}",
            content=data,
            headers={**self._headers, "Content-Type": content_type},
        )
        res.raise_for_status()

    async def delete_image(self, path: str) -> None:
        # Storage API removes objects in bulk: DELETE /object/<bucket> with {"prefixes": [...]}.
        res = await self._client.request(
            "DELETE", f"{self._url}/storage/v1/object/guides", json={"prefixes": [path]}, headers=self._headers
        )
        res.raise_for_status()

    async def signed_url(self, path: str, expires_at: datetime, now: datetime) -> str:
        # ARCH §8: signed URL dies at min(now + 10 min, guide expiry).
        expires_in = max(1, min(600, int((expires_at - now).total_seconds())))
        res = await self._client.post(
            f"{self._url}/storage/v1/object/sign/guides/{path}",
            json={"expiresIn": expires_in},
            headers=self._headers,
        )
        res.raise_for_status()
        signed = res.json()["signedURL"]
        # signedURL is storage-relative ("/object/sign/..."); the browser URL needs the /storage/v1 prefix.
        return signed if signed.startswith("http") else f"{self._url}/storage/v1{signed}"


async def purge_expired(store: GuideStore, now: datetime) -> int:
    """Delete expired guides and their private images (ARCH §8 purge job). One bad object never stops the sweep."""
    purged = 0
    for record in await store.list_expired(now):
        with contextlib.suppress(Exception):  # one bad record never stops the sweep; next run retries it
            failed = False
            for step in record.steps:
                image_path = step.get("image_path")
                if image_path:
                    try:
                        await store.delete_image(image_path)
                    except Exception:  # noqa: BLE001 - any storage error keeps the row for the next purge run
                        failed = True
            if failed:
                continue  # keep the row so the next run can find and retry these objects (review F3)
            await store.remove(record.token_hash)
            purged += 1
    return purged
