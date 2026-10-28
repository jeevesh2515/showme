FROM python:3.11-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

COPY pyproject.toml ./
COPY showme ./showme
RUN uv pip install --system --no-cache-dir .
RUN useradd -r app

EXPOSE 8000

USER app
CMD ["uvicorn", "showme.api.main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
