#!/usr/bin/env bash
# Live 20-task E2E run (EVAL-8) with a temporary per-IP rate-limit raise (D35) that is always restored.
# Spend caps (SPEND_CAP_DAILY_USD / SPEND_CAP_TOTAL_USD) are never touched; the harness enforces its own budget.
# Usage: scripts/e2e_live.sh [budget_usd]   (default 3). Needs a logged-in Vercel CLI; deploys the backend twice.
set -euo pipefail
cd "$(dirname "$0")/.."
BUDGET="${1:-3}"
api() { vercel "$@" --cwd backend; }

[ -z "$(git status --porcelain)" ] || { echo "working tree not clean; commit first so the run is tied to a SHA" >&2; exit 1; }
# Original settings: this script only supports the default state (RATE_* unset, code defaults 30/hour, 150/day).
if api env ls production 2>/dev/null | grep -qE '^\s*RATE_PER_(HOUR|DAY)\b'; then
  echo "RATE_PER_* already set on production; restore defaults by hand before running" >&2; exit 1
fi

restore() {
  set +e
  api env rm RATE_PER_HOUR production --yes >/dev/null 2>&1
  api env rm RATE_PER_DAY production --yes >/dev/null 2>&1
  api deploy --prod >/dev/null 2>&1
  if api env ls production 2>/dev/null | grep -qE '^\s*RATE_PER_(HOUR|DAY)\b'; then
    echo "RESTORE FAILED: RATE_PER_* still set on production; remove by hand and redeploy the backend" >&2; exit 1
  fi
  echo "restored: RATE_PER_* unset on production (defaults 30/hour, 150/day), backend redeployed"
}
trap restore EXIT

printf 500 | api env add RATE_PER_HOUR production >/dev/null
printf 500 | api env add RATE_PER_DAY production >/dev/null
api deploy --prod >/dev/null
make e2e E2E_LIMIT=20 E2E_BUDGET_USD="$BUDGET"
