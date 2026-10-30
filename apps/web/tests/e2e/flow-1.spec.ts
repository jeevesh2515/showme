import { expect, test } from "@playwright/test";
import { dragScreenshotOntoDropZone, mockApi, openReview, pasteScreenshot, IMAGE_FILE } from "./helpers";

test.describe("FLOW-1 add a screenshot and a goal", () => {
  test("FLOW-1 start screen offers goal input, drop zone, file input and help", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await expect(page.getByTestId("goal-input")).toBeVisible();
    await expect(page.getByTestId("drop-zone")).toBeVisible();
    await expect(page.getByTestId("file-input")).toBeAttached();
    await expect(page.getByTestId("screenshot-help")).toBeVisible();
  });

  test("FLOW-1 goal accepts 300 characters and no more", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    const goal = page.getByTestId("goal-input");
    await goal.fill("a".repeat(300));
    expect((await goal.inputValue()).length).toBe(300);
    await goal.fill("b".repeat(320));
    expect((await goal.inputValue()).length).toBeLessThanOrEqual(300);
  });

  test("FLOW-1 choosing a PNG file advances to the privacy review", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill("cancel my subscription");
    await page.getByTestId("file-input").setInputFiles(IMAGE_FILE);
    await expect(page.getByTestId("review-image")).toBeVisible();
  });

  test("FLOW-1 pasting a screenshot opens the review", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill("cancel my subscription");
    await pasteScreenshot(page);
    await expect(page.getByTestId("review-image")).toBeVisible();
  });

  test("FLOW-1 dragging a screenshot onto the drop zone opens the review", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill("cancel my subscription");
    await dragScreenshotOntoDropZone(page);
    await expect(page.getByTestId("review-image")).toBeVisible();
  });

  test("FLOW-1 a non-picture file is rejected with plain copy", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill("cancel my subscription");
    await page
      .getByTestId("file-input")
      .setInputFiles({ name: "notes.txt", mimeType: "text/plain", buffer: Buffer.from("not a picture") });
    await expect(page.getByText(/not a picture we can read|PNG or JPG/i).first()).toBeVisible();
    await expect(page.getByTestId("review-image")).toHaveCount(0);
  });

  test("FLOW-1 screenshot help toggles device instructions", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    const help = page.getByTestId("screenshot-help");
    const before = await help.getAttribute("aria-expanded");
    await help.click();
    if (before !== null) {
      await expect(help).not.toHaveAttribute("aria-expanded", before);
    } else {
      await expect(page.getByText(/iPhone|Android|Windows|Mac/i).first()).toBeVisible();
    }
  });
});
