// Builds the blind rating page + key. Deterministic, stdlib only.
// Usage: node build.mjs [--results <dir>] [--out <dir>]
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SEED = "showme-rating-2026-11-02";
export const N = 20;
export const RULE =
  `Eligible: an e2e step with a model target.box whose production SAM refine (pairs.jsonl, called in this same hash ` +
  `order, stopping at ${N} outlines) passed the agreement gate. Order eligible steps by sha256("${SEED}:<task>:<step>") ascending, ` +
  `take the first ${N} (all if fewer). Side of the SAM outline: lowest bit of sha256("${SEED}:side:<task>:<step>").`;

const here = dirname(fileURLToPath(import.meta.url));
const sha = (s) => createHash("sha256").update(s).digest("hex");

export function build({ resultsDir, outDir, pairsFile = join(outDir, "pairs.jsonl") }) {
  const trail = join(resultsDir, "trail");
  const pairs = new Map();
  if (existsSync(pairsFile)) for (const line of readFileSync(pairsFile, "utf8").split("\n").filter(Boolean)) { const p = JSON.parse(line); pairs.set(`${p.task}:${p.step}`, p.refine); }
  const steps = [];
  let total = 0;
  let withBox = 0;
  for (const task of readdirSync(trail).sort()) {
    const f = join(trail, task, "steps.jsonl");
    if (!existsSync(f)) continue;
    for (const line of readFileSync(f, "utf8").split("\n").filter(Boolean)) {
      const s = JSON.parse(line);
      total++;
      const box = s.response?.target?.box;
      if (box) withBox++;
      const r = s.refine ?? pairs.get(`${s.task}:${s.step}`);
      if (box && r?.mode === "outline" && r.svg_path && r.origin) steps.push({ s, box, r });
    }
  }
  const eligible = steps
    .map((e) => ({ ...e, h: sha(`${SEED}:${e.s.task}:${e.s.step}`) }))
    .sort((a, b) => (a.h < b.h ? -1 : 1));
  const picked = eligible.slice(0, N).map((e, i) => {
    const { task, step } = e.s;
    const sam_side = parseInt(sha(`${SEED}:side:${task}:${step}`).slice(0, 2), 16) & 1 ? "B" : "A";
    return { e, item: {
      item_id: `i${String(i + 1).padStart(2, "0")}`, task, step, sam_side,
      screenshot: relative(outDir, join(resultsDir, "trail", task, `step-${step}.jpg`)),
      goal: e.s.request?.goal ?? null,
      width: e.s.request.image_meta.width, height: e.s.request.image_meta.height,
    } };
  });
  const sample = {
    seed: SEED, rule: RULE, source_results: relative(outDir, resultsDir),
    steps_total: total, steps_with_model_box: withBox, sam_calls: pairs.size, gate_rejected: [...pairs.values()].filter((r) => r.mode !== "outline").length, eligible: eligible.length,
    selected: picked.length, items: picked.map((p) => p.item),
  };
  // Page data carries neutral path+transform per side only; no kind labels, no key.
  const boxD = ({ x1, y1, x2, y2 }) => `M${x1} ${y1}H${x2}V${y2}H${x1}Z`;
  const pageItems = picked.map(({ e, item }) => {
    const sam = { d: e.r.svg_path, tx: e.r.origin.x, ty: e.r.origin.y }; // svg_path is box-local (ARCHITECTURE §6)
    const box = { d: boxD(e.box), tx: 0, ty: 0 };
    const samA = item.sam_side === "A";
    return { id: item.item_id, img: item.screenshot, goal: item.goal, w: item.width, h: item.height,
      a: samA ? sam : box, b: samA ? box : sam };
  });
  const json = JSON.stringify(pageItems).replace(/</g, "\\u003c");
  const html = readFileSync(join(here, "rate.template.html"), "utf8").replace("/*DATA*/[]", json);
  return { sample, html };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const a = process.argv.slice(2);
  const opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
  const resultsDir = resolve(opt("--results", join(here, "../results/2026-11-02-e2e-bb543ba-04574992c7")));
  const outDir = resolve(opt("--out", here));
  const { sample, html } = build({ resultsDir, outDir });
  writeFileSync(join(outDir, "sample.json"), JSON.stringify(sample, null, 2) + "\n");
  writeFileSync(join(outDir, "rate.html"), html);
  console.log(`steps ${sample.steps_total}, with model box ${sample.steps_with_model_box}, eligible pairs ${sample.eligible}, selected ${sample.selected}`);
}
