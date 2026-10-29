import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { findPii, luhn, maskPii, type PiiKind } from "./patterns";

type Vector = {
  id: string;
  text: string;
  kind: PiiKind | "none";
  shouldMatch: boolean;
  render?: string;
  density?: number;
};

// Same file pytest reads (backend/tests/test_pii_shared_vectors.py), so the two cannot drift.
const vectors = (JSON.parse(readFileSync(new URL("./pii-vectors.json", import.meta.url), "utf8")) as { vectors: Vector[] }).vectors;
const positives = vectors.filter((v) => v.shouldMatch);
const negatives = vectors.filter((v) => !v.shouldMatch);

describe("patterns", () => {
  it("flow-2: shared corpus recall is >= 95% (reported with denominator)", () => {
    const missed = positives.filter((v) => findPii(v.text).length === 0);
    const recall = (positives.length - missed.length) / positives.length;
    console.log(`FLOW-2 recall ${(recall * 100).toFixed(1)}% (${positives.length - missed.length}/${positives.length}); missed: ${missed.map((v) => v.id).join(", ") || "none"}`);
    expect(positives.length).toBeGreaterThanOrEqual(30);
    expect(recall).toBeGreaterThanOrEqual(0.95);
  });

  it.each(vectors)("flow-2: $id matches shouldMatch=$shouldMatch", (vector) => {
    expect(findPii(vector.text).length > 0).toBe(vector.shouldMatch);
  });

  it("flow-2: positive vectors carry the expected kind", () => {
    for (const vector of positives) {
      expect(findPii(vector.text).map((span) => span.kind)).toContain(vector.kind);
    }
  });

  it("flow-2: reports false positives on negative vectors", () => {
    const falsePositives = negatives.filter((v) => findPii(v.text).length > 0);
    console.log(`FLOW-2 false positives ${falsePositives.length}/${negatives.length}: ${falsePositives.map((v) => v.id).join(", ") || "none"}`);
    expect(falsePositives).toEqual([]);
  });

  it("priv-6: luhn rejects a single-digit change and accepts the test cards", () => {
    expect(luhn("4111111111111111")).toBe(true);
    expect(luhn("4111111111111112")).toBe(false);
    expect(luhn("378282246310005")).toBe(true);
  });

  it("priv-7: masks goal text before it leaves the browser", () => {
    expect(maskPii("Email jane.doe@example.com about card 4111 1111 1111 1111")).toBe("Email [hidden] about card [hidden]");
    expect(maskPii("call +44 7700 900123")).toBe("call [hidden]");
    expect(maskPii("nothing private here")).toBe("nothing private here");
  });

  it("priv-7: masks every positive vector and leaves every negative untouched", () => {
    for (const vector of positives) {
      expect(maskPii(vector.text)).toContain("[hidden]");
      expect(maskPii(vector.text)).not.toBe(vector.text);
    }
    for (const vector of negatives) expect(maskPii(vector.text)).toBe(vector.text);
  });

  it("priv-7: collapses overlapping matches into one placeholder (same as pii.py)", () => {
    expect(maskPii("IBAN GB82 WEST 1234 5698 7654 32")).toBe("IBAN [hidden]");
    expect(maskPii("tel +1 415-555-0198 / IBAN DE89 3704 0044 0532 0130 00")).toBe("tel [hidden] / IBAN [hidden]");
  });
});
