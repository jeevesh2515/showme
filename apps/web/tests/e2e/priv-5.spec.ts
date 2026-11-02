import { expect, test, type Route } from "@playwright/test";
import { refineBox, refineOutline, stepDone, stepOk, stepOkSecond, stepUnsure } from "./fixtures";
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

  test("FLOW-7 FLOW-10 the shared guide keeps status and caution, and drops a step marked failed", async ({ page }) => {
    test.setTimeout(120_000);
    await mockApi(page, { steps: [stepOk(), { ...stepUnsure(), caution: "This will end your plan." }], refine: refineBox() });
    let body: { steps: { n: number; status: string; caution: string }[] } | null = null;
    await page.route("**/api/v1/guides", async (route) => {
      body = JSON.parse(route.request().postData() ?? "{}") as typeof body;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) });
    });
    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("failed-btn").click(); // helper says step 1 was wrong: the recipient must not be told to do it
    await addNextScreenshot(page);
    await continueToStep(page);
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();
    await expect(page.getByTestId("guide-url")).toBeVisible();
    expect(body).toMatchObject({ steps: [{ n: 1, status: "unsure", caution: "This will end your plan." }] });
    expect((body as unknown as { steps: unknown[] }).steps).toHaveLength(1);
  });

  test("PRIV-5 returning to share keeps the live link deletable and never creates a second one", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page, { steps: [stepOk()], refine: refineBox() });
    let creates = 0;
    await page.route("**/api/v1/guides", async (route) => {
      creates++;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) });
    });
    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();
    await expect(page.getByTestId("guide-url")).toBeVisible();
    await page.getByTestId("share-back").click();
    await page.getByTestId("share-early-btn").click();
    await expect(page.getByTestId("guide-url")).toBeVisible();
    await expect(page.getByTestId("delete-link")).toBeVisible();
    await expect(page.getByTestId("create-link")).toHaveCount(0);
    expect(creates).toBe(1);
  });

  test("PRIV-5 repeat taps on Create link send one request, and a failed attempt can be retried", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page, { steps: [stepOk()], refine: refineBox() });
    const held: Route[] = [];
    await page.route("**/api/v1/guides", (route) => { held.push(route); });
    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-consent").check();
    // Two activations in one task, so no re-render can disable the button between them.
    await page.getByTestId("create-link").evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
    await expect.poll(() => held.length).toBe(1);
    await expect(page.getByTestId("create-link")).toBeDisabled();
    await page.waitForTimeout(200);
    expect(held).toHaveLength(1);
    await held[0]!.fulfill({ status: 500, contentType: "application/json", body: "{}" });
    await expect(page.locator("p[role=alert]")).toBeVisible();
    await page.getByTestId("create-link").click();
    await expect.poll(() => held.length).toBe(2);
    await held[1]!.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) });
    await expect(page.getByTestId("guide-url")).toBeVisible();
  });

  test("PRIV-5 repeat taps on Delete now send one request and show no false error", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page, { steps: [stepOk()], refine: refineBox() });
    await page.route("**/api/v1/guides", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) }));
    const held: Route[] = [];
    await page.route("**/api/v1/guides/*", (route) => { held.push(route); });
    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();
    await page.getByTestId("delete-link").evaluate((b: HTMLButtonElement) => { b.click(); b.click(); });
    await expect.poll(() => held.length).toBe(1);
    await page.waitForTimeout(200);
    expect(held).toHaveLength(1);
    await held[0]!.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ deleted: true }) });
    await expect(page.getByTestId("guide-deleted")).toBeVisible();
    await expect(page.locator("p[role=alert]")).toHaveCount(0);
  });

  test("FLOW-7 a late outline for a rejected step never lands on another step", async ({ page }) => {
    test.setTimeout(120_000);
    await mockApi(page, { steps: [stepOk(), stepOkSecond(), stepOk()], refine: refineBox() });
    const outline = (svg_path: string) => ({ ...refineOutline(), svg_path });
    const heldB: Route[] = [];
    let refines = 0;
    await page.route("**/api/v1/refine*", async (route) => {
      refines++;
      if (refines === 1) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(outline("M1 1 L2 2 Z")) });
      if (refines === 2) { heldB.push(route); return; }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(refineBox()) });
    });
    let body: { steps: { instruction: string; svg_path: string | null }[] } | null = null;
    await page.route("**/api/v1/guides", async (route) => {
      body = JSON.parse(route.request().postData() ?? "{}") as typeof body;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) });
    });
    await openReview(page);
    await continueToStep(page); // step A, outline arrives
    await expect.poll(() => refines).toBe(1);
    await page.waitForTimeout(100);
    await page.getByTestId("next-btn").click();
    await addNextScreenshot(page);
    await continueToStep(page); // step B, outline held
    await expect.poll(() => heldB.length).toBe(1);
    await page.getByTestId("failed-btn").click();
    await heldB[0]!.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(outline("M9 9 L8 8 Z")) });
    await page.waitForTimeout(200);
    await addNextScreenshot(page);
    await continueToStep(page); // step C
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-check-1").check();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();
    await expect(page.getByTestId("guide-url")).toBeVisible();
    const steps = (body as unknown as { steps: { svg_path: string | null }[] }).steps;
    expect(steps.map((s) => s.svg_path)).toEqual(["M1 1 L2 2 Z", null]);
  });

  test("PRIV-5 starting over with a live link warns first, because the delete key goes with it", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page, { steps: [stepOk()], refine: refineBox() });
    await page.route("**/api/v1/guides", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) }));
    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();
    await expect(page.getByTestId("guide-url")).toBeVisible();
    await page.getByTestId("share-back").click();

    page.once("dialog", (d) => { expect(d.message()).toContain("delete"); void d.dismiss(); });
    await page.getByTestId("start-over").click();
    await page.getByTestId("share-early-btn").click();
    await expect(page.getByTestId("delete-link")).toBeVisible();
    await page.getByTestId("share-back").click();

    page.once("dialog", (d) => void d.accept());
    await page.getByTestId("start-over").click();
    await expect(page.getByTestId("goal-input")).toHaveValue("");
  });

  test("PRIV-5 a retried delete clears the earlier error", async ({ page }) => {
    test.setTimeout(90_000);
    await mockApi(page, { steps: [stepOk()], refine: refineBox() });
    await page.route("**/api/v1/guides", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ url: "http://localhost:3000/g/tok", delete_key: "dk", expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() }) }));
    let deletes = 0;
    await page.route("**/api/v1/guides/*", (route) => (++deletes === 1 ? route.fulfill({ status: 500, contentType: "application/json", body: "{}" }) : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ deleted: true }) })));
    await openReview(page);
    await continueToStep(page);
    await page.getByTestId("share-early-btn").click();
    await page.getByTestId("share-check-0").check();
    await page.getByTestId("share-consent").check();
    await page.getByTestId("create-link").click();
    await page.getByTestId("delete-link").click();
    await expect(page.locator("p[role=alert]")).toBeVisible();
    await page.getByTestId("delete-link").click();
    await expect(page.getByTestId("guide-deleted")).toBeVisible();
    await expect(page.locator("p[role=alert]")).toHaveCount(0);
  });

  test("PRIV-5 unknown guide shows the gone page, not a crash", async ({ page }) => {
    await page.goto("/g/definitely-not-a-real-token");
    await expect(page.getByText("This guide has gone")).toBeVisible();
  });
});
