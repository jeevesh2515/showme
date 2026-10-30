import { expect, test } from "@playwright/test";
import { stepUnsure } from "./fixtures";
import { reachStep } from "./helpers";

test.describe("FLOW-7 unsure is visibly hesitating", () => {
  test("FLOW-7 unsure draws a dashed ring and the exact check-before-you-tap text", async ({ page }) => {
    test.setTimeout(90_000);
    await reachStep(page, { steps: [stepUnsure()] });

    await expect(page.getByTestId("overlay-svg")).toBeVisible();
    // DESIGN §3: unsure is a dashed ring (12 / 8), so a dash array must be present.
    const dashed = page.getByTestId("overlay-svg").locator("[stroke-dasharray]");
    await expect(dashed.first()).toBeVisible();
    expect(await dashed.count()).toBeGreaterThan(0);
    expect(await dashed.first().getAttribute("stroke-dasharray")).toMatch(/12/);

    await expect(page.getByText("I think it is this one. Check before you tap.")).toBeVisible();
    await expect(page.getByTestId("step-instruction")).toBeVisible();
  });
});
