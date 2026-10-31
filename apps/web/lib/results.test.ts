import { describe, expect, it } from "vitest";
import results from "./results.generated.json";

// WEB-1/WEB-2 guard: landing/eval numbers exist, come from generated files, weakest included.
describe("results.generated.json", () => {
  it("has benchmark rows and headline picks traceable to predictions files", () => {
    expect(results.rows.length).toBeGreaterThan(0);
    for (const row of results.rows) expect(row.predictions).toMatch(/predictions\.jsonl$/);
    expect(results.headline.screenspotV2?.suite).toBe("screenspot-v2");
    expect(results.headline.screenspotPro?.suite).toBe("screenspot-pro");
    expect(results.headline.negatives?.suite).toBe("negatives");
    // Weakest benchmark must stay on the page, not only the best (RULES §2).
    const pcts = results.rows.map((r) => r.accuracyPct);
    expect(results.headline.screenspotPro?.accuracyPct).toBeLessThan(
      results.headline.screenspotV2?.accuracyPct ?? 0,
    );
    expect(Math.min(...pcts)).toBeGreaterThan(0);
  });
});
