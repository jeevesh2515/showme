#!/usr/bin/env bash
# Live 20-task E2E run (EVAL-8) with a temporary per-IP rate-limit raise (D35) that is always restored.
# Spend caps (SPEND_CAP_DAILY_USD / SPEND_CAP_TOTAL_USD) are never touched; the harness enforces its own budget.
# Usage: scripts/e2e_live.sh [budget_usd]   (default 3). Needs a logged-in Vercel CLI; deploys the backend twice.
set -euo pipefail
cd "$(dirname "$0")/.."
BUDGET="${1:-3}"
api() { vercel "$@" --cwd backend; }

[ -z "$(git status --porcelain)" ] || { echo "working tree not clean; commit first so the run is tied to a SHA" >&2; exit 1; }

# A failed listing is an error (rc 2), never proof that the vars are absent.
rate_vars() {
  local out
  out=$(api env ls production 2>/dev/null) || return 2
  grep -E '^\s*RATE_PER_(HOUR|DAY)\b' <<<"$out" || true
}

# Original settings: this script only supports the default state (RATE_* unset, code defaults 30/hour, 150/day).
set_vars=$(rate_vars) || { echo "cannot list production env vars; aborting before any change" >&2; exit 1; }
[ -z "$set_vars" ] || { echo "RATE_PER_* already set on production; restore defaults by hand before running" >&2; exit 1; }

restore() {
  local rc=$? failed=""
  trap - EXIT
  set +e
  # rm may fail with "not found" (var never added); absence is verified by listing instead.
  api env rm RATE_PER_HOUR production --yes >/dev/null 2>&1
  api env rm RATE_PER_DAY production --yes >/dev/null 2>&1
  local left
  left=$(rate_vars)
  case $? in
    0) [ -z "$left" ] || failed="env rm (RATE_PER_* still set)" ;;
    *) failed="verification listing (vercel env ls failed)" ;;
  esac
  # Env changes only reach new deployments, so the redeploy is what restores the live limits.
  if [ -z "$failed" ]; then api deploy --prod >/dev/null 2>&1 || failed="restore redeploy (vercel deploy --prod failed)"; fi
  if [ -n "$failed" ]; then
    {
      echo "RESTORE FAILED at: $failed. Production may still run raised limits (500/hour, 500/day)."
      echo "Recover by hand: vercel env rm RATE_PER_HOUR production --yes --cwd backend"
      echo "                 vercel env rm RATE_PER_DAY production --yes --cwd backend"
      echo "                 vercel deploy --prod --cwd backend"
      echo "                 vercel env ls production --cwd backend   # confirm no RATE_PER_*"
    } >&2
    exit 1
  fi
  echo "restored: RATE_PER_* unset on production (defaults 30/hour, 150/day), backend redeployed"
  exit "$rc" # keep the run's own failure
}
# Installed before the first env add so a partial raise is still restored.
trap restore EXIT

printf 500 | api env add RATE_PER_HOUR production >/dev/null
printf 500 | api env add RATE_PER_DAY production >/dev/null
api deploy --prod >/dev/null
make e2e E2E_LIMIT=20 E2E_BUDGET_USD="$BUDGET"
