import { expect, test } from "@playwright/test";
import { mockApi, openReview } from "./helpers";
import { GOAL } from "./fixtures";

test.describe("PRIV-2 redaction review is mandatory", () => {
  test("PRIV-2 no API call is possible before Continue on the review", async ({ page }) => {
    const api = await mockApi(page);
    await openReview(page, GOAL);
    await expect(page.getByTestId("review-continue")).toBeVisible();
    expect(api.allBodies.length).toBe(0);
    await page.getByTestId("review-continue").click();
    await expect(page.getByTestId("step-instruction")).toBeVisible();
    expect(api.allBodies.length).toBeGreaterThan(0);
  });
});
