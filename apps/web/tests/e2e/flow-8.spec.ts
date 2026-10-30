import { expect, test } from "@playwright/test";
import { stepDone, stepOk } from "./fixtures";
import { addNextScreenshot, continueToStep, mockApi, openReview, ringCount } from "./helpers";

test.describe("FLOW-8 done", () => {
  test("FLOW-8 a done step shows the completion screen and offers Share", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page, { steps: [stepOk(), stepDone()] });
    await openReview(page);
    await continueToStep(page);

    await page.getByTestId("next-btn").click();
    await addNextScreenshot(page);
    await continueToStep(page);

    await expect(page.getByTestId("done-screen")).toBeVisible();
    // DESIGN §4.5: the completion line uses the user's goal, not the raw model instruction.
    await expect(page.getByTestId("done-screen")).toContainText(/cancel my subscription/i);
    await expect(page.getByTestId("done-screen").getByText(/share/i).first()).toBeVisible();
    expect(await ringCount(page)).toBe(0);
    await expect(page.getByTestId("step-badge")).toHaveCount(0);
  });
});
