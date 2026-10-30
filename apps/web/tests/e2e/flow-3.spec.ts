import { expect, test } from "@playwright/test";
import { mockApi, openReview } from "./helpers";

test.describe("FLOW-3 review tools: brush, undo, zoom", () => {
  test("FLOW-3 brush, undo and zoom work on the privacy review", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page);
    await openReview(page);

    const image = page.getByTestId("review-image");
    const brush = page.getByTestId("brush-toggle");

    // Brush: toggle on, drag across the picture, then undo.
    await brush.click();
    if ((await brush.getAttribute("aria-pressed")) !== null) {
      await expect(brush).toHaveAttribute("aria-pressed", "true");
    }
    const box = await image.boundingBox();
    if (!box) throw new Error("review-image has no layout box");
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6, { steps: 5 });
    await page.mouse.up();

    const undo = page.getByTestId("undo-btn");
    await expect(undo).toBeEnabled();
    await undo.click();

    // Zoom: the rendered picture changes size, in and back out.
    const width = async (): Promise<number> => (await image.boundingBox())?.width ?? 0;
    const startWidth = await width();
    await page.getByTestId("zoom-in").click();
    await expect.poll(width).not.toBe(startWidth);
    const zoomedWidth = await width();
    await page.getByTestId("zoom-out").click();
    await expect.poll(width).not.toBe(zoomedWidth);

    // Review still usable after the tools were used.
    await expect(page.getByTestId("review-continue")).toBeEnabled();
  });
});
