import { expect, test } from "@playwright/test";
import { stepNotVisibleDown, stepNotVisibleNoScroll } from "./fixtures";
import { reachStep, ringCount } from "./helpers";

test.describe("FLOW-6 not_visible is honest", () => {
  test("FLOW-6 no highlight, the model hint and a scroll arrow when scroll_direction is set", async ({ page }) => {
    test.setTimeout(90_000);
    const step = stepNotVisibleDown();
    await reachStep(page, { steps: [step] });

    expect(await ringCount(page)).toBe(0);
    await expect(page.getByTestId("not-visible-panel")).toBeVisible();
    await expect(page.getByTestId("not-visible-panel")).toContainText(step.instruction);
    await expect(page.getByTestId("scroll-arrow")).toBeVisible();
  });

  test("FLOW-6 scroll_direction none removes the scroll arrow", async ({ page }) => {
    test.setTimeout(90_000);
    await reachStep(page, { steps: [stepNotVisibleNoScroll()] });

    await expect(page.getByTestId("not-visible-panel")).toBeVisible();
    await expect(page.getByTestId("scroll-arrow")).toHaveCount(0);
  });
});
