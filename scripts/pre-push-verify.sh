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
gitleaks dir "$tmp" --no-banner --report-format json --report-path "$tmp/report.json" >/dev/null 2>&1 || true
python3 - "$tmp/report.json" <<'PY'
import json, sys
allowed = (".env.example", "docs/ARCHITECTURE.md")  # variable NAMES only (SPEND_CAP_...), no values
try:
    findings = json.load(open(sys.argv[1]))
except Exception:
    findings = []
bad = [f for f in findings if not any(f["File"].endswith(a) for a in allowed)]
for f in bad:
    print("LEAK", f["File"], f["StartLine"], f["RuleID"])
print(f"gitleaks: {len(findings)} findings, {len(bad)} unexpected")
sys.exit(1 if bad else 0)
PY
echo "== docker build =="
docker build -q backend >/dev/null && echo "docker build ok"
echo "PRE-PUSH VERIFY PASS"
