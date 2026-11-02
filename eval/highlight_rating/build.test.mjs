import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "./build.mjs";
import { score } from "./score.mjs";

// Synthetic fixture: 30 steps with box + stored refine, 5 without refine.
function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "rating-"));
  const lines = [];
  for (let t = 0; t < 7; t++) for (let s = 1; s <= 5; s++) {
    const refine = t === 6 ? undefined : { mode: "outline", svg_path: "M0 0L10 0L10 10Z", origin: { x: 100, y: 100 } };
    lines.push({ task: `t${t}`, step: s, request: { goal: "g", image_meta: { width: 1280, height: 800 } },
      response: { target: { box: { x1: 100, y1: 100, x2: 200, y2: 150 } } }, refine });
  }
  for (let t = 0; t < 7; t++) {
    mkdirSync(join(dir, "trail", `t${t}`), { recursive: true });
    writeFileSync(join(dir, "trail", `t${t}`, "steps.jsonl"), lines.filter((l) => l.task === `t${t}`).map((l) => JSON.stringify(l)).join("\n") + "\n");
  }
  return dir;
}
const run = (dir) => build({ resultsDir: dir, outDir: join(dir, "out") });

test("deterministic", () => {
  const d = fixture();
  assert.deepEqual(run(d), run(d));
});

test("selects 20 of 30 eligible, sides mixed, key not in page", () => {
  const { sample, html } = run(fixture());
  assert.equal(sample.eligible, 30);
  assert.equal(sample.selected, 20);
  assert.ok(new Set(sample.items.map((i) => i.sam_side)).size === 2);
  assert.ok(!html.includes("sam_side") && !/sam|box/i.test(html.slice(html.indexOf("const ITEMS"), html.indexOf("const CH"))));
});

test("fewer than 20 eligible uses all, no padding", () => {
  const d = fixture();
  assert.ok(run(d).sample.selected <= 20);
});

const sample = { seed: "s", rule: "r", source_results: "x", eligible: 3,
  items: [{ item_id: "i01", sam_side: "A" }, { item_id: "i02", sam_side: "B" }, { item_id: "i03", sam_side: "A" }] };
const csv = "item_id,choice,rated_at\ni01,A,t\ni02,A,t\n";

test("score refuses partial", () => assert.throws(() => score(sample, csv), /only 2 of 3/));

test("score arithmetic", () => {
  const s = score(sample, csv + "i03,both_wrong,t\n");
  assert.equal(s.status, "complete");
  assert.deepEqual([s.sam_better, s.box_better, s.same, s.both_wrong], [1, 1, 0, 1]);
  const p = score(sample, csv, true);
  assert.equal(p.status, "partial");
  assert.equal(p.n_rated, 2);
});
