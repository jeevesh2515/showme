import asyncio
import json
import random
import time
from typing import Any

import httpx
from pydantic import ValidationError

from showme.core.prompts import SYSTEM_PROMPT, build_user_message
from showme.core.schema import GROUNDING_SCHEMA, ModelOutput
from showme.core.settings import Settings


class ModelError(Exception):
    """Unparsable/non-conforming model output or upstream failure after retries (API-2).

    `usage` accumulates tokens from EVERY generation attempt, including ones whose
    output failed parsing - that spend happened and must be accounted (review 2026-10-28).
    """

    def __init__(self, message: str, usage: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.usage: dict[str, Any] = usage or {}


class ModelTimeout(ModelError):
    """Grounding call exceeded its timeout (ARCH §9)."""


def _accumulate(total: dict[str, Any], usage: dict[str, Any] | None) -> None:
    for k, v in (usage or {}).items():
        if isinstance(v, (int, float)):
            total[k] = total.get(k, 0) + v


async def _post(client: httpx.AsyncClient, settings: Settings, payload: dict[str, Any]) -> httpx.Response:
    """POST with 429 backoff: jitter from 500 ms, honour Retry-After, max 3 tries (API-5)."""
    delay = settings.backoff_base_s
    for attempt in range(3):
        resp = await client.post(
            f"{settings.base_url}/chat/completions",
            json=payload,
            headers={"Authorization": f"Bearer {settings.api_key}"},
            timeout=settings.ground_timeout_s,
        )
        if resp.status_code != 429 or attempt == 2:
            return resp
        retry_after = resp.headers.get("Retry-After")
        wait = (
            float(retry_after)
            if retry_after and retry_after.replace(".", "", 1).isdigit()
            else delay + random.uniform(0, delay)
        )
        if wait > 0:
            await asyncio.sleep(wait)
        delay *= 2
    raise ModelError("unreachable")  # loop always returns


async def ground(
    image_data_url: str, goal: str, history: list[dict[str, Any]], settings: Settings
) -> tuple[ModelOutput, dict[str, Any], int]:
    payload: dict[str, Any] = {
        "model": settings.model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": build_user_message(goal, history)},
                    {"type": "image_url", "image_url": {"url": image_data_url}},
                ],
            },
        ],
        "response_format": {
            "type": "json_schema",
            "json_schema": {"name": "showme_step", "schema": GROUNDING_SCHEMA, "strict": True},
        },
        "temperature": 0,
        "reasoning_effort": settings.effort,
        "max_tokens": 1024,
    }
    t0 = time.perf_counter()
    total_usage: dict[str, Any] = {}
    async with httpx.AsyncClient() as client:
        # One retry on unparsable output, then ModelError (API-2).
        for _ in range(2):
            try:
                resp = await _post(client, settings, payload)
            except httpx.TimeoutException as e:
                raise ModelTimeout(str(e), usage=total_usage) from e
            except httpx.HTTPError as e:
                raise ModelError(str(e), usage=total_usage) from e
            if resp.status_code != 200:
                raise ModelError(f"model API HTTP {resp.status_code}", usage=total_usage)
            try:
                data = resp.json()
                _accumulate(total_usage, data.get("usage"))  # before parsing: failed parses still cost
                content = data["choices"][0]["message"]["content"]
                parsed = ModelOutput.model_validate(json.loads(content))
                return parsed, total_usage, int((time.perf_counter() - t0) * 1000)
            except (KeyError, IndexError, TypeError, ValueError, ValidationError):
                continue
    raise ModelError("unparsable model output after retry", usage=total_usage)
