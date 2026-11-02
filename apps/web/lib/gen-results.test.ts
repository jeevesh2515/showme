import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// Publication selection (HACKATHON C): a frozen-prompt re-run must replace stale headlines.
describe("gen-results selection", () => {
  it("newest equal-size benchmark wins, SHA-tagged E2E beats old -final, honesty stays split", () => {
    const root = mkdtempSync(join(tmpdir(), "showme-results-"));
    const row = (date: string, suite: string, n: number, pct: string, dir: string) =>
      `| ${date} | ${suite} | heldout | muse-spark-1.3 | minimal | ${n} | ${pct} | \`${dir}/predictions.jsonl\` |`;
    writeFileSync(join(root, "RESULTS.md"), [
      "# Results (generated)",
      "",
      "| date | suite | split | model | effort | n | accuracy | predictions |",
      "| --- | --- | --- | --- | --- | --- | --- | --- |",
      row("2026-10-29", "screenspot-v2", 1172, "90.7%", "2026-10-29-old-pvv1-aaa"),
      row("2026-11-02", "screenspot-v2", 1172, "89.9%", "2026-11-02-new-pvv3-bbb"),
      row("2026-10-29", "negatives", 222, "64.4%", "2026-10-29-neg-pvv1-ccc"),
    ].join("\n"));
    mkdirSync(join(root, "2026-10-29-neg-pvv1-ccc"), { recursive: true });
    writeFileSync(join(root, "2026-10-29-neg-pvv1-ccc", "summary.json"), JSON.stringify({
      by_expected_status: { not_visible: { n: 210, hits: 131, accuracy: 0.6238 }, refuse: { n: 12, hits: 12, accuracy: 1 } },
    }));
    const e2eDir = (dir: string, passed: number) => {
      mkdirSync(join(root, dir), { recursive: true });
      const tasks = Array.from({ length: 20 }, (_, i) => ({ id: `t${i}`, success: i < passed, steps: 3, refused: false }));
      writeFileSync(join(root, dir, "results.json"), JSON.stringify({ date: "2026-11-02", tasks, success_rate: passed / 20, avg_steps: 3 }));
    };
    e2eDir("2026-11-01-e2e-final", 14);
    e2eDir("2026-11-02-e2e-abc1234-120000abcd", 12);

    const out = join(root, "out.json");
    execFileSync("node", [join(__dirname, "..", "scripts", "gen-results.mjs")], {
      env: { ...process.env, SHOWME_RESULTS_DIR: root, SHOWME_RESULTS_OUT: out },
    });
    const data = JSON.parse(require("node:fs").readFileSync(out, "utf8"));
    expect(data.headline.screenspotV2.accuracyPct).toBe(89.9);
    expect(data.headline.screenspotV2.promptVersion).toBe("3");
    expect(data.headline.e2e.dir).toBe("2026-11-02-e2e-abc1234-120000abcd");
    expect(data.headline.honesty.notVisiblePct).toBe(62.4);
    expect(data.headline.honesty.refuseHits).toBe(12);
  });

  it("same-day equal-size runs publish the newer prompt, and absent pairs exclude injection probes", () => {
    const root = mkdtempSync(join(tmpdir(), "showme-results-"));
    const row = (suite: string, n: number, pct: string, dir: string) =>
      `| 2026-11-02 | ${suite} | heldout | muse-spark-1.3 | minimal | ${n} | ${pct} | \`${dir}/predictions.jsonl\` |`;
    writeFileSync(join(root, "RESULTS.md"), [
      row("screenspot-v2", 1172, "90.7%", "a-pvv2-aaa"),
      row("screenspot-v2", 1172, "89.9%", "b-pvv3-bbb"),
      row("negatives", 222, "77.9%", "c-pvv3-ccc"),
    ].join("\n"));
    mkdirSync(join(root, "c-pvv3-ccc"), { recursive: true });
    writeFileSync(join(root, "c-pvv3-ccc", "summary.json"), JSON.stringify({
      by_expected_status: { not_visible: { n: 210, hits: 161, accuracy: 0.7667 }, refuse: { n: 12, hits: 12, accuracy: 1 } },
      by_group: { "synthetic-injection": { n: 10, hits: 10, accuracy: 1 } },
    }));
    const out = join(root, "out.json");
    execFileSync("node", [join(__dirname, "..", "scripts", "gen-results.mjs")], {
      env: { ...process.env, SHOWME_RESULTS_DIR: root, SHOWME_RESULTS_OUT: out },
    });
    const data = JSON.parse(require("node:fs").readFileSync(out, "utf8"));
    expect(data.headline.screenspotV2.promptVersion).toBe("3");
    expect(data.headline.honesty).toMatchObject({ absentHits: 151, absentN: 200, absentPct: 75.5, injectionHits: 10, injectionN: 10 });
  });
});
