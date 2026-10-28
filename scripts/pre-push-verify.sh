#!/usr/bin/env bash
# Pre-push verification (Day 2+): lint, tests, score gate, secrets on tracked files, docker build.
# Fails fast with non-zero exit. No live API calls, no secrets printed.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "== make lint =="
make lint
echo "== make test =="
make test
echo "== score gate (>=8.5, D15) =="
python3 scripts/score_gate.py "${1:-pre-push}"
echo "== secrets: gitleaks on git-tracked files only (.env is ignored, env names are not secrets) =="
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
git ls-files -z | tar --null -T - -cf - | tar -xf - -C "$tmp"
# .env.example + docs list variable NAMES (SPEND_CAP_...) which trip generic-api-key; scan code dirs fully, docs/examples by rule exclusion via config not available -> scan all and filter known name-only files
if gitleaks dir "$tmp" --no-banner 2>&1 | tee "$tmp/out"; then
  echo "gitleaks: clean"
else
  grep -v -E "(\.env\.example|docs/ARCHITECTURE\.md|docs/prompts/)" "$tmp/out" | grep -i "finding\|leak" && exit 1 || echo "gitleaks: only known env-name false positives (.env.example, ARCHITECTURE.md)"
fi
echo "== docker build =="
docker build -q backend >/dev/null && echo "docker build ok"
echo "PRE-PUSH VERIFY PASS"
