// WEB-1/WEB-2: numbers come from generated eval files only (RULES §2). Run at build;
// on hosts without the repo root (Vercel root = apps/web) the committed JSON is kept.
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const resultsDir = process.env.SHOWME_RESULTS_DIR ?? join(webRoot, "..", "..", "eval", "results");
const out = process.env.SHOWME_RESULTS_OUT ?? join(webRoot, "lib", "results.generated.json");

if (!existsSync(join(resultsDir, "RESULTS.md"))) {
  console.log("gen-results: eval/results not present, keeping committed results.generated.json");
  process.exit(0);
}

const rows = readFileSync(join(resultsDir, "RESULTS.md"), "utf8")
  .split("\n")
  .filter((l) => /^\| 20\d\d-/.test(l))
  .map((l) => {
    const c = l.split("|").map((s) => s.trim());
    return { date: c[1], suite: c[2], split: c[3], model: c[4], effort: c[5], n: Number(c[6]), accuracyPct: Number(c[7].replace("%", "")), predictions: c[8].replaceAll("`", ""), promptVersion: /pvv(\d+)/.exec(c[8])?.[1] ?? null };
  });

// Largest n wins; on a tie the newest run wins, so a frozen-prompt re-run replaces its older equal-size row.
const pick = (fn) => rows.filter(fn).sort((a, b) => b.n - a.n || b.date.localeCompare(a.date))[0] ?? null;
let e2e = null;
for (const dir of readdirSync(resultsDir).filter((d) => d.includes("-e2e")).sort()) {
  const p = join(resultsDir, dir, "results.json");
  if (!existsSync(p)) continue;
  const r = JSON.parse(readFileSync(p, "utf8"));
  if (r.tasks.length !== 20) continue; // headline is the full suite only; subset re-runs are triage evidence
  const candidate = { dir, date: r.date, tasksRun: r.tasks.length, passed: r.tasks.filter((t) => t.success).length, successPct: Math.round(r.success_rate * 1000) / 10, avgSteps: r.avg_steps, refusals: r.tasks.filter((t) => t.refused).length };
  // Recency: SHA/time-tagged run dirs (current harness) beat the audited -final, which beats ad-hoc suffixes.
  const rank = (d) => (/-e2e-[0-9a-f]+-\d{6}/.test(d) ? 3 : d.endsWith("-final") ? 2 : 1);
  const key = (c) => `${rank(c.dir)}:${c.date}:${c.dir}`;
  if (!e2e || key(candidate) > key(e2e)) e2e = candidate;
}

// Honesty split (never blended): strict not_visible on absent targets, and refusals, from the negatives summary.
let honesty = null;
const neg = pick((r) => r.suite === "negatives");
if (neg) {
  const summaryPath = join(resultsDir, neg.predictions.replace("predictions.jsonl", "summary.json"));
  if (existsSync(summaryPath)) {
    const s = JSON.parse(readFileSync(summaryPath, "utf8"));
    const nv = s.by_expected_status?.not_visible, rf = s.by_expected_status?.refuse;
    if (nv && rf) honesty = { notVisiblePct: Math.round(nv.accuracy * 1000) / 10, notVisibleHits: nv.hits, notVisibleN: nv.n, refuseHits: rf.hits, refuseN: rf.n, promptVersion: neg.promptVersion, predictions: neg.predictions };
  }
}

const data = {
  generatedFrom: "eval/results/RESULTS.md",
  rows,
  headline: {
    screenspotV2: pick((r) => r.suite === "screenspot-v2" && r.split === "heldout"),
    screenspotPro: pick((r) => r.suite === "screenspot-pro" && r.model === "muse-spark-1.3"),
    negatives: pick((r) => r.suite === "negatives"),
    honesty,
    e2e,
  },
};
writeFileSync(out, JSON.stringify(data, null, 2) + "\n");
console.log(`gen-results: wrote ${out} (${rows.length} rows, e2e ${e2e?.dir ?? "none"})`);
