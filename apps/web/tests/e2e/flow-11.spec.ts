import { expect, test } from "@playwright/test";
import { GOAL, stepOk, stepOkSecond } from "./fixtures";
import { addNextScreenshot, continueToStep, mockApi, openReview } from "./helpers";

test.describe("FLOW-11 next screenshot keeps text-only history", () => {
  test("FLOW-11 the second step request sends the goal and a text-only history", async ({ page }) => {
    test.setTimeout(120_000);
    const first = stepOk();
    const api = await mockApi(page, { steps: [first, stepOkSecond()] });
    await openReview(page);
    await continueToStep(page);

    await page.getByTestId("next-btn").click();
    await addNextScreenshot(page);
    await continueToStep(page);

    await expect.poll(() => api.stepBodies.length).toBe(2);
    const second = api.stepBodies[1] ?? {};
    expect(second.goal).toBe(GOAL);

    const history = second.history as Record<string, unknown>[];
    expect(Array.isArray(history)).toBe(true);
    expect(history).toHaveLength(1);
    expect(history[0]).toEqual({
      n: 1,
      instruction: first.instruction,
      action: first.action,
      target_label: first.target?.label,
      result: "done",
    });
    expect(JSON.stringify(history)).not.toContain("data:image");
    expect(JSON.stringify(history)).not.toContain("base64");
  });
});
