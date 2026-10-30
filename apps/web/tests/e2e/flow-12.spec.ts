import { expect, test } from "@playwright/test";
import { stepOk, stepOkSecond } from "./fixtures";
import { addNextScreenshot, continueToStep, mockApi, openReview } from "./helpers";

test.describe("FLOW-12 that did not work", () => {
  test("FLOW-12 the next request carries the last step as result: failed", async ({ page }) => {
    test.setTimeout(120_000);
    const first = stepOk();
    const api = await mockApi(page, { steps: [first, stepOkSecond()] });
    await openReview(page);
    await continueToStep(page);

    await page.getByTestId("failed-btn").click();
    await addNextScreenshot(page);
    await continueToStep(page);

    await expect.poll(() => api.stepBodies.length).toBe(2);
    const history = (api.stepBodies[1] ?? {}).history as Record<string, unknown>[];
    expect(history).toHaveLength(1);
    expect(history[0]?.result).toBe("failed");
    expect(history[0]?.instruction).toBe(first.instruction);
  });
});
