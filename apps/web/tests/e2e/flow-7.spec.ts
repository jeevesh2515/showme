import { expect, test } from "@playwright/test";
import { IMAGE, refineOutline, stepUnsure } from "./fixtures";
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

  test("FLOW-7 an unsure step stays dashed when SAM supplies an outline", async ({ page }) => {
    test.setTimeout(90_000);
    await reachStep(page, { steps: [stepUnsure()], refine: refineOutline() });
    const outline = page.getByTestId("overlay-svg").locator("g.refine-fade path");
    await expect(outline).toHaveCount(3);
    for (const dash of await outline.evaluateAll((els) => els.map((e) => e.getAttribute("stroke-dasharray")))) expect(dash).toBeTruthy();
  });

  test("DESIGN 3: the ring and badge keep their CSS size when the screenshot is scaled down", async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 240, height: 700 });
    await reachStep(page, { steps: [stepUnsure()] });
    const svg = page.getByTestId("overlay-svg");
    const shown = (await svg.boundingBox())?.width ?? 0;
    expect(shown).toBeLessThan(IMAGE.width);
    await expect.poll(async () => Number(await svg.locator("[data-testid=step-badge] circle").getAttribute("r")) * (shown / IMAGE.width)).toBeCloseTo(16, 0);
  });
});
