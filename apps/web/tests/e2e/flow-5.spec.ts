import { expect, test } from "@playwright/test";
import { refineOutline } from "./fixtures";
import { reachStep } from "./helpers";

const normalize = (d: string): string => d.replace(/[\s,]+/g, "");

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
