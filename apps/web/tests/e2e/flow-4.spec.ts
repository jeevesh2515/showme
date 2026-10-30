import { expect, test } from "@playwright/test";
import { IMAGE, stepOk, target } from "./fixtures";
import { mockApi, openReview, ringCount } from "./helpers";

test.describe("FLOW-4 an ok step holds a ring, a badge and one sentence", () => {
  test("FLOW-4 shows progress, then a highlight box, a numbered badge and the instruction", async ({ page }) => {
    test.setTimeout(90_000);
    const step = stepOk();
    await mockApi(page, { steps: [step], delayMs: 800 });
    await openReview(page);
    await page.getByTestId("review-continue").click();

    // DESIGN §4.3: live progress text while the model works, never a bare spinner.
    await expect(page.getByTestId("progress-text")).toBeVisible();
    await expect(page.getByTestId("step-instruction")).toBeVisible();

    await expect(page.getByTestId("overlay-svg")).toBeVisible();
    await expect(page.getByTestId("overlay-svg")).toHaveAttribute(
      "viewBox",
      `0 0 ${IMAGE.width} ${IMAGE.height}`,
    );
    expect(await ringCount(page)).toBeGreaterThan(0);

    await expect(page.getByTestId("step-badge")).toBeVisible();
    expect(await page.getByTestId("step-badge").textContent()).toMatch(/1/);

    await expect(page.getByTestId("step-instruction")).toHaveText(step.instruction);
    await expect(page.getByTestId("step-instruction")).toContainText(target.label);
  });
});
