import { createHash } from "node:crypto";
import { expect, test } from "@playwright/test";
import { refineBox, stepOk } from "./fixtures";
import { IMAGE_B64, IMAGE_BYTES, continueToStep, openReview } from "./helpers";

test.describe("PRIV-1 the raw screenshot never leaves the browser", () => {
  test("PRIV-1 no request carries the original image bytes, hash or base64", async ({ page }) => {
    test.setTimeout(120_000);
    const bodies: { url: string; body: string }[] = [];

    // One handler for every request the page makes, so nothing can slip past a glob.
    await page.route("**/*", async (route) => {
      const request = route.request();
      const url = request.url();
      if (!url.includes("/api/")) {
        await route.continue();
        return;
      }
      bodies.push({ url, body: request.postData() ?? "" });
      if (url.includes("/api/v1/step")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(stepOk()) });
        return;
      }
      if (url.includes("/api/v1/refine")) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(refineBox()) });
        return;
      }
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await openReview(page);
    await continueToStep(page);

    const stepBodies = bodies.filter((entry) => entry.url.includes("/api/v1/step"));
    expect(stepBodies).toHaveLength(1);
    const sent = stepBodies[0]?.body ?? "";
    expect(sent.length).toBeGreaterThan(0);

    const sha256Hex = createHash("sha256").update(IMAGE_BYTES).digest("hex");
    const sha256B64 = createHash("sha256").update(IMAGE_BYTES).digest("base64");
    const originalDataUrl = `data:image/png;base64,${IMAGE_B64}`;

    for (const { url, body } of bodies) {
      expect(body, `original base64 leaked to ${url}`).not.toContain(IMAGE_B64);
      expect(body.toLowerCase(), `original sha256 leaked to ${url}`).not.toContain(sha256Hex);
      expect(body, `original sha256 (base64) leaked to ${url}`).not.toContain(sha256B64);
      expect(body, `original data URL leaked to ${url}`).not.toContain(originalDataUrl);
    }

    // What does leave is the redacted canvas re-encode, which is a different image.
    const payload = JSON.parse(sent) as { image?: string; image_meta?: { width?: number; height?: number } };
    expect(typeof payload.image).toBe("string");
    expect(payload.image ?? "").toMatch(/^data:image\/(jpeg|webp|png);base64,/);
    expect(payload.image).not.toBe(originalDataUrl);
    expect(payload.image_meta?.width).toBeGreaterThan(0);
    expect(payload.image_meta?.height).toBeGreaterThan(0);
  });
});
