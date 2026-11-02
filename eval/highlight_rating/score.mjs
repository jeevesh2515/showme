// Unblinds ratings. Usage: node score.mjs <ratings.csv> [--partial]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const CHOICES = ["A", "B", "same", "both_wrong"];

export function score(sample, csvText, partial = false) {
  const side = new Map(sample.items.map((i) => [i.item_id, i.sam_side]));
  const rated = new Map(); // last rating per item wins
  for (const line of csvText.split("\n").slice(1).filter(Boolean)) {
    const [id, choice] = line.split(",");
    if (!side.has(id)) throw new Error(`unknown item_id ${id}`);
    if (!CHOICES.includes(choice)) throw new Error(`bad choice ${choice} for ${id}`);
    rated.set(id, choice);
  }
  const n = rated.size, selected = sample.items.length;
  if (n < selected && !partial) throw new Error(`only ${n} of ${selected} rated; pass --partial to score anyway`);
  const c = { sam_better: 0, box_better: 0, same: 0, both_wrong: 0 };
  for (const [id, ch] of rated) {
    if (ch === "same") c.same++;
    else if (ch === "both_wrong") c.both_wrong++;
    else if (ch === side.get(id)) c.sam_better++;
    else c.box_better++;
  }
  return {
    status: n === 0 ? "not run" : n < selected ? "partial" : "complete",
    n_rated: n, n_selected: selected, ...c,
    selection_rule: sample.rule, seed: sample.seed, source_results: sample.source_results,
    eligible: sample.eligible, raters: 1,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [csvPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!csvPath) { console.error("usage: node score.mjs <ratings.csv> [--partial]"); process.exit(2); }
  try {
    const sample = JSON.parse(readFileSync(join(here, "sample.json"), "utf8"));
    const s = score(sample, readFileSync(csvPath, "utf8"), process.argv.includes("--partial"));
    writeFileSync(join(here, "summary.json"), JSON.stringify(s, null, 2) + "\n");
    console.log(JSON.stringify(s, null, 2));
  } catch (e) { console.error(e.message); process.exit(1); }
}
