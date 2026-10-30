import { expect, test } from "@playwright/test";
import { mockApi, openReview } from "./helpers";

test.describe("FLOW-2 automatic hiding on the review screen", () => {
  // Accuracy/recall is measured by the vitest corpus test (REQUIREMENTS FLOW-2).
  // Here we prove the review screen is honest when OCR finds nothing: our fixture
  // screenshot contains shapes only, no text, so zero lines is the correct answer.
  test("FLOW-2 a screenshot with no text shows no auto blocks and says so", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page);
    await openReview(page);

    await expect
      .poll(
        async () =>
          (await page.getByTestId("ocr-line").count()) + (await page.getByText(/could not find any text/i).count()),
        { timeout: 45_000 },
      )
      .toBeGreaterThan(0);

    expect(await page.getByTestId("ocr-line").count()).toBe(0);
    await expect(page.getByText(/could not find any text/i)).toBeVisible();

    // The mandatory review still lets the user continue, and the API is only called then (PRIV-2).
    await page.getByTestId("review-continue").click();
    await expect(page.getByTestId("step-instruction")).toBeVisible();
  });
});
