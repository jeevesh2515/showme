import { expect, test } from "@playwright/test";
import path from "node:path";
import { mockApi, openReview } from "./helpers";

// Phone-sized touch context: a finger drag must not be swallowed by page scroll (touch-action).
test.describe("FLOW-3 brush on a touch screen", () => {
  test.use({ viewport: { width: 393, height: 852 }, hasTouch: true, isMobile: true });
  test("FLOW-3 a finger drag with the brush hides an area", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page);
    await openReview(page);
    await page.getByTestId("brush-toggle").tap();
    const image = page.getByTestId("review-image");
    await image.scrollIntoViewIfNeeded();
    const box = await image.boundingBox();
    if (!box) throw new Error("review-image has no layout box");
    const hidden = page.getByTestId("hidden-region");
    const before = await hidden.count();
    const cdp = await page.context().newCDPSession(page);
    const at = (f: number) => [{ x: box.x + box.width * (0.2 + f * 0.4), y: box.y + box.height * (0.3 + f * 0.4) }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) });
    for (let i = 1; i <= 6; i++) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i / 6) });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(hidden).toHaveCount(before + 1);
  });

  test("FLOW-3 a thumb tap on or near a thin text line hides that line", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill("cancel my subscription");
    await page.getByTestId("file-input").setInputFiles(path.join(__dirname, "assets", "ocr-a.png"));
    const lines = page.getByTestId("ocr-line");
    await expect(lines.first()).toBeAttached({ timeout: 30_000 });
    const hidden = page.getByTestId("hidden-region");
    const style = (l: typeof lines) => l.evaluate((e) => `${(e as HTMLElement).style.left} ${(e as HTMLElement).style.top}`);
    const lastHidden = () => hidden.last().evaluate((e) => `${(e as HTMLElement).style.left} ${(e as HTMLElement).style.top}`);
    const img = await page.getByTestId("review-image").boundingBox();
    if (!img) throw new Error("review-image has no layout box");

    // Exact tap on the first line hides that line, not a neighbour.
    const first = await lines.first().boundingBox();
    if (!first) throw new Error("ocr-line has no layout box");
    let n = await hidden.count();
    await page.touchscreen.tap(first.x + first.width / 2, first.y + first.height / 2);
    await expect(hidden).toHaveCount(n + 1);
    expect(await lastHidden()).toBe(await style(lines.first()));

    // A tap 15 px below the lowest line (a thumb miss) still hides it: the target is 44 px, not the line height.
    const boxes = await lines.evaluateAll((els) => els.map((e) => e.getBoundingClientRect().bottom));
    const lowest = lines.nth(boxes.indexOf(Math.max(...boxes)));
    const low = await lowest.boundingBox();
    if (!low) throw new Error("ocr-line has no layout box");
    n = await hidden.count();
    await page.touchscreen.tap(low.x + low.width / 2, Math.min(low.y + low.height + 15, img.y + img.height - 1));
    await expect(hidden).toHaveCount(n + 1);
    expect(await lastHidden()).toBe(await style(lowest));
  });
});

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
    const hidden = page.getByTestId("hidden-region");
    const before = await hidden.count();
    const box = await image.boundingBox();
    if (!box) throw new Error("review-image has no layout box");
    await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.4);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6, { steps: 5 });
    await page.mouse.up();
    await expect(hidden).toHaveCount(before + 1);

    const undo = page.getByTestId("undo-btn");
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(hidden).toHaveCount(before);

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

  test("FLOW-3 undo can be redone and Hide all text covers every OCR line", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill("cancel my subscription");
    await page.getByTestId("file-input").setInputFiles(path.join(__dirname, "assets", "ocr-a.png"));
    await expect(page.getByTestId("ocr-line").first()).toBeAttached({ timeout: 30_000 });

    const hidden = page.getByTestId("hidden-region");
    const before = await hidden.count();
    await page.getByTestId("hide-all-btn").click();
    const afterHideAll = await hidden.count();
    expect(afterHideAll).toBeGreaterThan(before);

    await page.getByTestId("undo-btn").click();
    await expect(hidden).toHaveCount(afterHideAll - 1);
    await page.getByTestId("redo-btn").click();
    await expect(hidden).toHaveCount(afterHideAll);
  });
});
