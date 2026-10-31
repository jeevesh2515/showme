import { expect, test } from "@playwright/test";
import { stepDone, stepOk } from "./fixtures";
import { addNextScreenshot, continueToStep, mockApi, openReview, IMAGE_B64 } from "./helpers";

test.describe("PRIV-5 share flow", () => {
  test("PRIV-5 share needs second review + consent, creates and deletes a link", async ({ page }) => {
    test.setTimeout(90_000);
    const api = await mockApi(page, { steps: [stepOk(), stepDone()] });
    const captured: { body: Record<string, unknown> | null } = { body: null };
    await page.route("**/api/v1/guides", async (route) => {
      if (route.request().method() === "POST") {
        captured.body = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ url: "http://localhost:3000/g/tok123", delete_key: "dk-secret", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }),
        });
        return;
      }
      await route.fallback();
    });
    await page.route("**/api/v1/guides/*", async (route) => {
      if (route.request().method() === "DELETE") {
        expect(route.request().headers()["x-delete-key"]).toBe("dk-secret");
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ deleted: true }) });
        return;
      }
      await route.fallback();
    });

    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("next-btn").click();
    await addNextScreenshot(page);
    await continueToStep(page);
    await expect(page.getByTestId("done-screen")).toBeVisible();

    await page.getByTestId("share-btn").click();
    // Second review: every step image shown again; Create stays off until all checked + consent.
    await expect(page.getByTestId("share-image-0")).toBeVisible();
    await expect(page.getByTestId("create-link")).toBeDisabled();
    const checks = page.locator('[data-testid^="share-check-"]');
    for (let i = 0; i < (await checks.count()); i++) await checks.nth(i).check();
    await expect(page.getByTestId("create-link")).toBeDisabled();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();

    await expect(page.getByTestId("guide-url")).toContainText("/g/tok123");
    await expect(page.getByTestId("guide-expiry")).toContainText("deletes itself on");
    expect(captured.body?.consent).toBe(true);
    const steps = captured.body?.steps as { image: string }[];
    expect(steps.length).toBeGreaterThan(0);
    // PRIV-1: shared images are redacted-pipeline output, never the original fixture bytes.
    for (const s of steps) {
      expect(s.image.startsWith("data:image/")).toBe(true);
      expect(s.image).not.toContain(IMAGE_B64);
    }
    expect(api.allBodies.length).toBeGreaterThan(0);

    await page.getByTestId("copy-link").click();
    await expect(page.getByText("Copied")).toBeVisible();
    await page.getByTestId("delete-link").click();
    await expect(page.getByTestId("guide-deleted")).toBeVisible();
  });

  test("PRIV-5 unknown guide shows the gone page, not a crash", async ({ page }) => {
    await page.goto("/g/definitely-not-a-real-token");
    await expect(page.getByText("This guide has gone")).toBeVisible();
  });
});
