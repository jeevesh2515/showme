import type { HistoryItem, StepResponse } from "./api/client";

/** FLOW-11/12: history is text only, kept in tab memory by the caller. Backend caps at 20 (API-1). */
export function appendHistory(history: readonly HistoryItem[], step: StepResponse, result: "done" | "failed"): HistoryItem[] {
  return [...history, { n: history.length + 1, instruction: step.instruction, action: step.action, target_label: step.target?.label ?? "", result }].slice(-20);
}

/** DESIGN §4.3 progress copy; >10s gets the long-wait line. */
export function progressText(elapsedMs: number): string {
  if (elapsedMs > 10_000) return "This is taking longer than usual. Looking at your screen";
  return elapsedMs > 2_500 ? "Finding the button" : "Looking at your screen";
}
