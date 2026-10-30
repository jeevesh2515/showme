import { expect, test } from "@playwright/test";
import { stepCaution } from "./fixtures";
import { reachStep } from "./helpers";

test.describe("FLOW-10 caution", () => {
  test("FLOW-10 a non-empty caution is shown above the instruction with an icon and the word Careful", async ({ page }) => {
    test.setTimeout(90_000);
    const step = stepCaution();
    await reachStep(page, { steps: [step] });

    const banner = page.getByTestId("caution-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Careful");
    await expect(banner).toContainText(step.caution);
    // Not colour alone: a warning icon (svg or the ⚠ glyph) plus the words.
    const hasSvgIcon = (await banner.locator("svg").count()) > 0;
    const hasGlyph = /⚠|!/.test((await banner.textContent()) ?? "");
    expect(hasSvgIcon || hasGlyph).toBe(true);

    const bannerBox = await banner.boundingBox();
    const instructionBox = await page.getByTestId("step-instruction").boundingBox();
    if (!bannerBox || !instructionBox) throw new Error("caution or instruction has no layout box");
    expect(bannerBox.y).toBeLessThan(instructionBox.y);
  });
});
