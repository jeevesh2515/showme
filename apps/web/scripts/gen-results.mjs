// WEB-1/WEB-2: numbers come from generated eval files only (RULES §2). Run at build;
// on hosts without the repo root (Vercel root = apps/web) the committed JSON is kept.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = join(webRoot, "..", "..", "eval", "results");
const out = join(webRoot, "lib", "results.generated.json");

if (!existsSync(join(resultsDir, "RESULTS.md"))) {
  console.log("gen-results: eval/results not present, keeping committed results.generated.json");
  process.exit(0);
}

const rows = readFileSync(join(resultsDir, "RESULTS.md"), "utf8")
  .split("\n")
  .filter((l) => /^\| 20\d\d-/.test(l))
  .map((l) => {
    const c = l.split("|").map((s) => s.trim());
    return { date: c[1], suite: c[2], split: c[3], model: c[4], effort: c[5], n: Number(c[6]), accuracyPct: Number(c[7].replace("%", "")), predictions: c[8].replaceAll("`", "") };
  });

const pick = (fn) => rows.filter(fn).sort((a, b) => b.n - a.n)[0] ?? null;
let e2e = null;
const e2eDirs = readdirSync(resultsDir).filter((d) => d.includes("-e2e")).sort();
for (const dir of [...e2eDirs.filter((d) => !d.endsWith("-final")), ...e2eDirs.filter((d) => d.endsWith("-final"))]) {
  const p = join(resultsDir, dir, "results.json");
  if (!existsSync(p)) continue;
  const r = JSON.parse(readFileSync(p, "utf8"));
  if (r.tasks.length !== 20) continue; // headline is the full suite only; subset re-runs are triage evidence
  e2e = { dir, date: r.date, tasksRun: r.tasks.length, passed: r.tasks.filter((t) => t.success).length, successPct: Math.round(r.success_rate * 1000) / 10, avgSteps: r.avg_steps, refusals: r.tasks.filter((t) => t.refused).length };
}

const data = {
  generatedFrom: "eval/results/RESULTS.md",
  rows,
  headline: {
    screenspotV2: pick((r) => r.suite === "screenspot-v2" && r.split === "heldout"),
    screenspotPro: pick((r) => r.suite === "screenspot-pro" && r.model === "muse-spark-1.3"),
    negatives: pick((r) => r.suite === "negatives"),
    e2e,
  },
};
writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
console.log(`gen-results: wrote ${out} (${rows.length} rows, e2e ${e2e?.dir ?? "none"})`);
