// Phase 4 manual smoke on live site. Public pages only, no accounts. Saves trail + outcomes.
import { createRequire } from "node:module";
const { chromium } = createRequire(new URL("../../../apps/web/package.json", import.meta.url))("@playwright/test");
import { writeFileSync, mkdirSync } from "node:fs";

const LIVE = "https://showme-web-delta.vercel.app/app";
const TASKS = [
  { id: "1-bbc-cookies", url: "https://www.bbc.co.uk", goal: "Reject all cookies" },
  { id: "2-govuk-passport", url: "https://www.gov.uk", goal: "Renew my passport" },
  { id: "3-nhs-gp", url: "https://www.nhs.uk", goal: "Find a GP near me" },
  { id: "4-royalmail-track", url: "https://www.royalmail.com", goal: "Track a parcel" },
  { id: "5-apple-cancel", url: "https://support.apple.com", goal: "How do I cancel a subscription from Apple?" },
];
mkdirSync("trail", { recursive: true });
const outcomes = [];
for (const t of TASKS) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    await page.goto(t.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(2500);
    const shot = `trail/${t.id}-source.png`;
    await page.screenshot({ path: shot });
    await page.goto(LIVE, { waitUntil: "networkidle", timeout: 45000 }).catch(() => page.goto(LIVE));
    await page.waitForTimeout(1500); // let React hydrate before setInputFiles
    await page.getByTestId("goal-input").fill(t.goal);
    await page.getByTestId("file-input").setInputFiles(shot);
    await page.getByTestId("review-continue").waitFor({ timeout: 60000 });
    await page.screenshot({ path: `trail/${t.id}-review.png` });
    await page.getByTestId("review-continue").click();
    await page.getByTestId("step-instruction").waitFor({ timeout: 60000 });
    const instruction = (await page.getByTestId("step-instruction").innerText()).trim();
    const caution = await page.getByTestId("caution-banner").count();
    await page.screenshot({ path: `trail/${t.id}-step.png`, fullPage: true });
    outcomes.push(`${t.id}: step="${instruction}" caution=${caution > 0}`);
    console.log(t.id, "OK", instruction.slice(0, 90));
  } catch (e) {
    outcomes.push(`${t.id}: FAILED ${String(e).slice(0, 200)}`);
    console.log(t.id, "FAILED", String(e).slice(0, 200));
    await page.screenshot({ path: `trail/${t.id}-error.png` }).catch(() => {});
  }
  await browser.close();
}
writeFileSync("outcomes.txt", outcomes.join("\n") + "\n");
