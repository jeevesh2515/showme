import { describe, expect, it } from "vitest";
import { appendHistory, progressText } from "./flow";
import type { HistoryItem, StepResponse } from "./api/client";

function step(partial: Partial<StepResponse>): StepResponse {
  return {
    step_id: "st_1", status: "ok", action: "tap", instruction: "Tap Save, the blue button at the bottom.",
    target: { label: "Save", point: { x: 10, y: 10 }, box: { x1: 1, y1: 1, x2: 20, y2: 20 } },
    scroll_direction: "none", type_text: "", caution: "", confidence: 0.9, goal_complete: false,
    model: "muse-spark-1.3", timings_ms: { ground: 100 }, cost_usd: 0.005, ...partial,
  };
}

describe("flow history (FLOW-11, FLOW-12)", () => {
  it("flow-11: next keeps instruction as text-only history", () => {
    const h: HistoryItem[] = [];
    const next = appendHistory(h, step({}), "done");
    expect(next).toEqual([{ n: 1, instruction: "Tap Save, the blue button at the bottom.", action: "tap", target_label: "Save", result: "done" }]);
    expect(JSON.stringify(next)).not.toContain("data:image");
  });
  it("flow-12: that-didnt-work marks last step failed", () => {
    const next = appendHistory([], step({ instruction: "Tap X." }), "failed");
    expect(next[0]?.result).toBe("failed");
  });
  it("flow-4: progress text switches with elapsed time", () => {
    expect(progressText(0)).toBe("Looking at your screen");
    expect(progressText(3_000)).toBe("Finding the button");
    expect(progressText(11_000)).toContain("taking longer than usual");
  });
});
