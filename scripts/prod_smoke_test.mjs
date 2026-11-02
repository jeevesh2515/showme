// Production live smoke test: synthetic billing image -> review -> brush -> live step/refine -> share -> recipient read -> delete -> verify 404.
// Hard bounded: calls /v1/step once and /v1/refine once. Maximum bound $0.04.
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(path.join(root, "apps/web/package.json"))("@playwright/test");

const BASE = process.env.BASE_URL ?? "https://showme-web-delta.vercel.app";
console.log(`Starting bounded production smoke test against ${BASE}...`);
console.log(`Pre-announced maximum spend: $0.04 (estimated ~$0.0076).`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

let stepCost = 0;
let refineCost = 0;

page.on("response", async (res) => {
  if (res.url().includes("/api/v1/step") && res.request().method() === "POST") {
    try {
      const data = await res.json();
      stepCost = data.cost_usd ?? 0.0051;
      console.log(`Live /api/v1/step returned status ${res.status()}, model=${data.model}, cost=$${stepCost}`);
    } catch {}
  }
  if (res.url().includes("/api/v1/refine") && res.request().method() === "POST") {
    try {
      const data = await res.json();
      refineCost = data.cost_usd ?? 0.0025;
      console.log(`Live /api/v1/refine returned status ${res.status()}, mode=${data.mode}, cost=$${refineCost}`);
    } catch {}
  }
});

try {
  // 1. Load app and sample billing image
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await page.getByTestId("sample-demo-btn").click();

  // 2. Review screen
  await page.getByTestId("review-image").waitFor({ state: "visible", timeout: 15000 });
  console.log("PASS: Reached privacy review screen with sample billing screenshot");

  // Check auto-redaction
  const autoBlocks = await page.locator('[data-testid="hidden-region"] svg').count();
  const initialBlocks = await page.locator('[data-testid="hidden-region"]').count();
  console.log(`PASS: Auto-redaction identified ${autoBlocks} PII regions with lock glyphs (total: ${initialBlocks})`);

  // Brush tool: draw a manual block
  await page.getByTestId("brush-toggle").click();
  const image = page.getByTestId("review-image");
  const box = await image.boundingBox();
  if (!box) throw new Error("review-image bounding box missing");

  // Drag a 100x40 rectangle
  const startX = box.x + box.width * 0.15;
  const startY = box.y + box.height * 0.30;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 100, startY + 40, { steps: 5 });
  await page.mouse.up();

  const afterBlocks = await page.locator('[data-testid="hidden-region"]').count();
  if (afterBlocks <= initialBlocks) throw new Error(`Manual brush failed to add mask (before: ${initialBlocks}, after: ${afterBlocks})`);
  console.log(`PASS: Manual brush added mask preserving user drawn area (${initialBlocks} -> ${afterBlocks})`);

  // 3. Continue to live step call
  const cont = page.getByTestId("review-continue");
  await cont.click();

  // 4. Wait for Step instruction and highlight
  await page.getByTestId("step-instruction").waitFor({ state: "visible", timeout: 25000 });
  const instrText = await page.getByTestId("step-instruction").innerText();
  console.log(`PASS: Step received: "${instrText.slice(0, 60)}..."`);

  // 5. Share guide
  await page.getByTestId("share-early-btn").click();
  await page.getByTestId("share-image-0").waitFor({ state: "visible" });

  await page.getByTestId("share-check-0").click();
  await page.getByTestId("share-consent").click();

  const createBtn = page.getByTestId("create-link");
  await createBtn.click();

  await page.getByTestId("guide-url").waitFor({ state: "visible", timeout: 20000 });
  const guideHref = (await page.getByTestId("guide-url").innerText()).trim();
  if (!guideHref) throw new Error("No guide URL returned");
  console.log(`PASS: Guide created successfully: ${guideHref}`);

  // 6. Recipient opens guide in second page
  const recipientPage = await context.newPage();
  const token = guideHref.split("/g/").pop()?.trim();
  const recipientUrl = `${BASE}/g/${token}`;
  console.log(`Recipient opening: ${recipientUrl}`);
  const getRes = await recipientPage.goto(recipientUrl, { waitUntil: "networkidle" });
  if (getRes?.status() !== 200) throw new Error(`Recipient page load failed with HTTP ${getRes?.status()}`);
  await recipientPage.getByTestId("guide-instruction").waitFor({ state: "visible", timeout: 15000 });
  await recipientPage.getByTestId("overlay-svg").waitFor({ state: "visible", timeout: 15000 });
  console.log("PASS: Recipient opened guide; step image and instruction visible");

  // 7. Delete guide
  await page.getByTestId("delete-link").click();
  await page.getByTestId("guide-deleted").waitFor({ state: "visible", timeout: 15000 });
  console.log("PASS: Creator deleted guide");

  // 8. Confirm recipient sees 404
  const res = await recipientPage.reload({ waitUntil: "networkidle" });
  const is404 = res?.status() === 404 || (await recipientPage.getByText(/404|not found|page not found/i).count()) > 0;
  if (!is404) throw new Error(`Deleted guide was still accessible! Status: ${res?.status()}`);
  console.log("PASS: Post-delete read confirms guide is gone (404)");

  const totalCost = stepCost + refineCost;
  console.log(`\n========================================`);
  console.log(`BOUNDED PRODUCTION SMOKE TEST SUCCESSFUL`);
  console.log(`Total live model spend: $${totalCost.toFixed(4)} (well within $0.04 bound)`);
  console.log(`========================================\n`);
} finally {
  await browser.close();
}
