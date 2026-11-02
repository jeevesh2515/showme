import { expect, test } from "@playwright/test";
import { refineOutline } from "./fixtures";
import { mockApi, openReview, reachStep } from "./helpers";

const normalize = (d: string): string => d.replace(/[\s,]+/g, "");

test("FLOW-4 on a laptop-height window the step opens with the ring in view", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 600 });
  await mockApi(page);
  await openReview(page);
  await page.getByTestId("review-continue").click(); // the review page is taller than the window, so this scrolls down
  await expect(page.getByTestId("step-badge")).toBeInViewport();
});

test("FLOW-4 on a laptop-height window the progress text stays in view while the model looks", async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 1280, height: 600 });
  await mockApi(page, { delayMs: 3000 });
  await openReview(page);
  await page.getByTestId("review-continue").click();
  await expect(page.getByTestId("progress-text")).toBeInViewport();
  await expect(page.getByTestId("step-instruction")).toBeVisible(); // let the delayed mock finish before the page closes
});

test.describe("FLOW-5 SAM outline replaces the box", () => {
  test("FLOW-5 the refine outline appears with no layout shift", async ({ page }) => {
    test.setTimeout(90_000);
    const outline = refineOutline();
    const api = await reachStep(page, { refine: outline, refineDelayMs: 800 });

    const svg = page.getByTestId("overlay-svg");
    await expect(svg).toBeVisible();

    const svgBefore = await svg.boundingBox();
    const instructionBefore = await page.getByTestId("step-instruction").boundingBox();

    // The outline path arrives from /api/v1/refine and is drawn as-is.
    const want = normalize(outline.svg_path ?? "");
    await expect
      .poll(
        async () =>
          (
            await svg.locator("path").evaluateAll((nodes) =>
              nodes.map((node) => (node.getAttribute("d") ?? "").replace(/[\s,]+/g, "")),
            )
          ).some((d) => d.includes(want)),
        { timeout: 20_000 },
      )
      .toBe(true);

    expect(api.refineBodies.length).toBeGreaterThan(0);

    // Crossfade, not a re-layout: nothing moves when the outline arrives.
    expect(await svg.boundingBox()).toEqual(svgBefore);
    expect(await page.getByTestId("step-instruction").boundingBox()).toEqual(instructionBefore);
  });
});
