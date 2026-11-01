import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

// Hard spend cap for the E2E harness. Pure logic, no I/O, so it is unit tested without a browser.
// Worst case per loop step: /v1/step ~$0.0051 + /v1/refine ~$0.0025 + one retry of each ($0.0076) = $0.0152, rounded up.
export const STEP_RESERVE_USD = 0.02;
const EPS = 1e-9;

// Unknown (missing, non-numeric or negative cost_usd) is null, never 0.
export const costOf = (body) => {
  const c = body?.cost_usd;
  return typeof c === "number" && Number.isFinite(c) && c >= 0 ? c : null;
};

export class Budget {
  constructor(budgetUsd, stepReserveUsd = STEP_RESERVE_USD) {
    this.budgetUsd = budgetUsd;
    this.stepReserveUsd = stepReserveUsd;
    this.knownUsd = 0; // sum of cost_usd actually reported
    this.chargedUsd = 0; // known + conservative charges for unknowns
    this.unknownResponses = 0;
    this.outstandingUsd = 0; // reserved for steps in flight
    this.stopped = false;
  }

  canAdmit() {
    return this.chargedUsd + this.outstandingUsd + this.stepReserveUsd <= this.budgetUsd + EPS;
  }

  reserve() {
    this.outstandingUsd += this.stepReserveUsd;
  }

  // costs: one entry per request the step made (number, or null when unknown). Empty means a request
  // may have been sent without any accounting, so it counts as one unknown.
  settle(costs) {
    const all = costs.length ? costs : [null];
    const known = all.reduce((s, c) => s + (c ?? 0), 0);
    const unknown = all.filter((c) => c === null).length;
    this.outstandingUsd = Math.max(0, this.outstandingUsd - this.stepReserveUsd);
    this.knownUsd += known;
    this.unknownResponses += unknown;
    // An unknown response charges the whole reservation once per step; known costs above it are charged as reported.
    this.chargedUsd += unknown ? Math.max(known, this.stepReserveUsd) : known;
    return known;
  }
}

// Reconcile one run into eval/results/spend.json (same shape as showme_eval.report.update_spend). Charges the
// conservative total so caps never undercount; a label already present is skipped, so a run is never counted twice.
export function recordSpend(path, label, chargedUsd, knownUsd, unknownResponses, date) {
  if (!(chargedUsd > 0)) return false;
  const data = existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : { total_usd: 0, runs: [] };
  if (data.runs.some((r) => r.label === label)) return false;
  data.total_usd = Math.round((data.total_usd + chargedUsd) * 1e4) / 1e4;
  data.runs.push({ date, label, cost_usd: Math.round(chargedUsd * 1e4) / 1e4, known_usd: Math.round(knownUsd * 1e4) / 1e4, unknown_cost_responses: unknownResponses });
  writeFileSync(`${path}.tmp`, JSON.stringify(data, null, 2));
  renameSync(`${path}.tmp`, path);
  return true;
}
