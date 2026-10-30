import { expect, test } from "@playwright/test";
import path from "node:path";
import { GOAL, refineOutline, refineBox, stepOk, stepOkSecond } from "./fixtures";
import { mockApi } from "./helpers";

const OCR_A = { name: "ocr-a.png", mimeType: "image/png", buffer: require("node:fs").readFileSync(path.join(__dirname, "assets", "ocr-a.png")) };
const OCR_B = { name: "ocr-b.png", mimeType: "image/png", buffer: require("node:fs").readFileSync(path.join(__dirname, "assets", "ocr-b.png")) };

test.describe("Review race regressions (2026-10-30 review)", () => {
  test("FLOW-2 real OCR runs under production CSP and auto-hides an email", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill(GOAL);
    await page.getByTestId("file-input").setInputFiles(OCR_A);
    await expect(page.getByTestId("review-image")).toBeVisible();
    // Distinguishes OCR-failure / no-text from a real hit: an auto block must exist.
    await expect(page.locator("text=/We hid [1-9]/")).toBeVisible({ timeout: 30_000 });
    expect(await page.getByTestId("ocr-line").count()).toBeGreaterThan(0);
  });

  test("PRIV-2 rapid uploads: review shows only the latest screenshot's regions", async ({ page }) => {
    await mockApi(page);
    await page.goto("/app");
    await page.getByTestId("goal-input").fill(GOAL);
    await page.getByTestId("file-input").setInputFiles(OCR_A);
    await page.getByTestId("file-input").setInputFiles(OCR_B);
    await expect(page.getByTestId("review-image")).toBeVisible();
    await expect(page.getByTestId("ocr-line").first()).toBeVisible({ timeout: 30_000 });
    const labels = await page.getByTestId("ocr-line").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label") ?? ""));
    expect(labels.join(" ")).toContain("bob");
    expect(labels.join(" ")).not.toContain("alice");
  });

  test("FLOW-5 late SAM outline for a previous step never replaces the newer step", async ({ page }) => {
    await mockApi(page, { steps: [stepOk(), stepOkSecond()], refines: [refineOutline(), refineBox()], refineDelayMs: 2_500 });
    await page.goto("/app");
    await page.getByTestId("goal-input").fill(GOAL);
    await page.getByTestId("file-input").setInputFiles(OCR_A);
    await page.getByTestId("review-continue").click();
    await expect(page.getByTestId("step-instruction")).toContainText("Cancel subscription");
    // Advance before A's delayed refine resolves.
    await page.getByTestId("next-btn").click();
    await page.getByTestId("file-input").setInputFiles(OCR_B);
    await page.getByTestId("review-continue").click();
    await expect(page.getByTestId("step-instruction")).toContainText("Confirm cancellation");
    await page.waitForTimeout(3_500); // A's refine has now resolved in the background
    const paths = await page.getByTestId("overlay-svg").locator("path").evaluateAll((els) => els.map((e) => e.getAttribute("d") ?? ""));
    expect(paths.join(" ")).not.toContain("M 0 0 L 160 0");
  });
});
