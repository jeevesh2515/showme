# ShowMe — one-command workflows. Web targets land Day 3.
SUITE ?= screenspot-v2
SPLIT ?= dev
N ?= 100
MODEL ?= muse-spark-1.3
EFFORT ?= minimal
SAM ?= off
MAXSIDE ?= 2560

.PHONY: setup dev test lint smoke eval e2e

setup:
	uv sync --project backend
	uv sync --project eval

dev:
	uv run --project backend uvicorn showme.api.main:app --reload --port 8000

test:
	uv run --project backend pytest backend/tests -q
	uv run --project eval pytest eval/tests -q

lint:
	uv run --project backend ruff check backend eval
	uv run --project backend ruff format --check backend eval
	uv run --project backend mypy --strict backend/showme/core

smoke:
	uv run --project eval python -m showme_eval --suite screenspot-v2 --split dev --n 10

eval:
	uv run --project eval python -m showme_eval --suite $(SUITE) --split $(SPLIT) --n $(N) --model $(MODEL) --effort $(EFFORT) --sam $(SAM) --max-side $(MAXSIDE)

e2e:
	@echo "not run: e2e starts Day 5"
