import { expect, test } from "@playwright/test";
import { stepRefuse } from "./fixtures";
import { reachStep, ringCount } from "./helpers";

test.describe("FLOW-9 refuse", () => {
  test("FLOW-9 a refusal shows a calm explanation and no highlight", async ({ page }) => {
    test.setTimeout(90_000);
    const step = stepRefuse();
    await reachStep(page, { steps: [step] });

    await expect(page.getByTestId("refuse-panel")).toBeVisible();
    await expect(page.getByTestId("refuse-panel")).toContainText(step.instruction);
    expect(await ringCount(page)).toBe(0);
    await expect(page.getByTestId("step-badge")).toHaveCount(0);
  });
});
