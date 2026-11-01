import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { Budget, STEP_RESERVE_USD, costOf, recordSpend } from "./budget.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const RUN = join(HERE, "run.mjs");
const SHEET = join(HERE, "highlight_ratings.csv");
// Tests never touch the real eval/results/spend.json.
const run = (...a) =>
  spawnSync("node", [RUN, "--web", "http://127.0.0.1:9", "--spend-file", join(mkdtempSync(join(tmpdir(), "spend-")), "spend.json"), ...a], { encoding: "utf8", timeout: 30_000 });

test("budget: nearly exhausted budget refuses admission", () => {
  const b = new Budget(3.0, 0.02);
  b.chargedUsd = 2.99;
  assert.equal(b.canAdmit(), false);
});

test("budget: exact fit admits, in-flight reservation counts", () => {
  const b = new Budget(3.0, 0.02);
  b.chargedUsd = 2.98;
  assert.equal(b.canAdmit(), true);
  b.reserve();
  assert.equal(b.canAdmit(), false);
});

test("budget: unknown cost charges the reservation, never 0", () => {
  const b = new Budget(3.0, 0.02);
  b.reserve();
  b.settle([0.0051, null]);
  assert.equal(b.unknownResponses, 1);
  assert.equal(b.knownUsd, 0.0051);
  assert.equal(b.chargedUsd, 0.02);
  b.reserve();
  b.settle([]);
  assert.equal(b.unknownResponses, 2);
  assert.equal(b.chargedUsd, 0.04);
});

test("budget: settle releases reservation and records actual", () => {
  const b = new Budget(3.0, 0.02);
  b.reserve();
  assert.ok(Math.abs(b.settle([0.0051, 0.0025]) - 0.0076) < 1e-12);
  assert.equal(b.outstandingUsd, 0);
  assert.ok(Math.abs(b.chargedUsd - 0.0076) < 1e-12);
  assert.equal(b.unknownResponses, 0);
});

test("budget: costOf treats missing or bad cost_usd as unknown", () => {
  assert.equal(costOf({ cost_usd: 0.005 }), 0.005);
  assert.equal(costOf({ cost_usd: 0 }), 0);
  for (const bad of [null, {}, { cost_usd: "0.1" }, { cost_usd: -1 }, { cost_usd: NaN }]) assert.equal(costOf(bad), null);
});

test("outdir: existing directory is refused before any browser launches", () => {
  const dir = mkdtempSync(join(tmpdir(), "e2e-exists-"));
  const t = Date.now();
  const r = run("--out", dir, "--limit", "1");
  assert.notEqual(r.status, 0);
  assert.match(r.stderr, /output directory already exists/);
  assert.ok(Date.now() - t < 10_000);
});

test("outdir: fresh run writes sheet inside run dir and leaves shared sheet untouched", () => {
  const before = readFileSync(SHEET);
  const dir = join(mkdtempSync(join(tmpdir(), "e2e-fresh-")), "run");
  const r = run("--out", dir, "--limit", "1", "--budget-usd", "0");
  assert.equal(r.status, 0, r.stderr);
  const res = JSON.parse(readFileSync(join(dir, "results.json"), "utf8"));
  assert.equal(res.stopped_on_budget, true);
  assert.equal(res.charged_usd, 0);
  assert.equal(res.unknown_cost_responses, 0);
  assert.equal(res.step_reserve_usd, STEP_RESERVE_USD);
  assert.ok(existsSync(join(dir, "report.md")));
  assert.match(readFileSync(join(dir, "highlight_ratings.csv"), "utf8"), /^task,step,screenshot,shown,rating\n/);
  assert.deepEqual(readFileSync(SHEET), before);
});

test("spend: records charged once per run label, skips zero and duplicates", () => {
  const f = join(mkdtempSync(join(tmpdir(), "spend-")), "spend.json");
  assert.equal(recordSpend(f, "run-a", 0, 0, 0, "2026-11-01"), false);
  assert.equal(existsSync(f), false);
  assert.equal(recordSpend(f, "run-a", 0.52, 0.5, 1, "2026-11-01"), true);
  assert.equal(recordSpend(f, "run-a", 0.52, 0.5, 1, "2026-11-01"), false);
  const d = JSON.parse(readFileSync(f, "utf8"));
  assert.equal(d.total_usd, 0.52);
  assert.deepEqual(d.runs, [{ date: "2026-11-01", label: "run-a", cost_usd: 0.52, known_usd: 0.5, unknown_cost_responses: 1 }]);
});

test("budget: near the limit, a step at maximum supported cost is refused, never overshoots", () => {
  const maxStep = 0.029184 + 0.0025; // backend max_step_cost(spark) + SAM, see budget.mjs
  const b = new Budget(3.0);
  b.chargedUsd = 2.98;
  assert.equal(b.canAdmit(), false);
  const fit = new Budget(3.0);
  fit.chargedUsd = 3.0 - STEP_RESERVE_USD;
  assert.equal(fit.canAdmit(), true);
  fit.reserve();
  fit.settle([0.029184, 0.0025]);
  assert.ok(fit.chargedUsd <= 3.0 + 1e-9, `charged ${fit.chargedUsd} overshoots`);
  assert.ok(STEP_RESERVE_USD >= maxStep);
});
test("run: --step-reserve-usd below the pricing worst case is refused", () => {
  const res = run("--out", join(mkdtempSync(join(tmpdir(), "e2e-")), "new"), "--limit", "1", "--step-reserve-usd", "0.02");
  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /step-reserve-usd must be >=/);
});
