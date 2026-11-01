// Headed iPhone 16 walkthrough of the full ShowMe flow, paced for a person to watch:
// landing -> /app -> example screenshot -> privacy review (auto blocks, brush, near-tap) -> step (docked card)
// -> early share (create link on the local API) -> /eval.
// /api/v1/step and /api/v1/refine are mocked (no Meta API call, $0). /api/v1/guides goes to the local backend,
// which never calls Meta. Any other /api request is aborted and reported.
// Usage: node scripts/headed_iphone16_demo.mjs [baseURL] [outDir]
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium, devices } = createRequire(path.join(root, "apps/web/package.json"))("@playwright/test");
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve(process.argv[3] ?? path.join(os.tmpdir(), "showme-headed-demo"));
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (area, name, pass, detail = "") => {
  results.push({ area, name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} [${area}] ${name}${detail ? ` :: ${detail}` : ""}`);
};
const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const pause = (page, ms) => page.waitForTimeout(ms);
const scrollTo = (page, y) => page.evaluate((top) => new Promise((r) => { window.scrollTo({ top, behavior: "smooth" }); setTimeout(r, 1000); }), y);
const sectionTop = (page, sel) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 70);

// Layout probe: overflow against the device width (mobile emulation widens the layout viewport to fit overflow),
// interactive targets under 44 px (inline text links exempt), smallest font.
const probe = (page) => page.evaluate(() => {
  const vis = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && !e.closest(".sr-only"); };
  const small = [...document.querySelectorAll("a, button, summary, input:not([type=file]):not([type=checkbox]), label:has(input[type=checkbox])")]
    .filter(vis)
    .filter((e) => getComputedStyle(e).pointerEvents !== "none") // keyboard-only proxies (OCR line buttons) take no taps
    .filter((e) => !(e.tagName === "A" && getComputedStyle(e).display === "inline" && e.closest("p, li")))
    .map((e) => ({ t: (e.innerText || e.getAttribute("aria-label") || e.tagName).trim().slice(0, 30), h: Math.round(e.getBoundingClientRect().height), w: Math.round(e.getBoundingClientRect().width) }))
    .filter((r) => r.h < 44 || r.w < 44);
  return { overflow: document.documentElement.scrollWidth - screen.width, small };
});

const browser = await chromium.launch({ headless: false, slowMo: Number(process.env.SLOWMO ?? 650) });
const context = await browser.newContext({ ...devices["iPhone 16"], locale: "en-GB" });
const page = await context.newPage();
const VH = page.viewportSize().height; // 659 on iPhone 16: the visible area under Safari toolbars, not the 852 screen
const errors = [];
const blocked = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

let target = { label: "Cancel subscription", point: { x: 479, y: 632 }, box: { x1: 395, y1: 613, x2: 564, y2: 651 } };
await page.route("**/api/**", async (route) => {
  const url = route.request().url();
  if (/\/v1\/step/.test(url)) {
    await new Promise((r) => setTimeout(r, 1500));
    return route.fulfill({ json: {
      step_id: "demo_1", status: "ok", action: "tap", instruction: 'Tap "Cancel subscription", the button under your plan details.',
      target, scroll_direction: "none", type_text: "", caution: "Careful: cancelling ends your plan at the end of this month.",
      confidence: 0.95, goal_complete: false, model: "muse-spark-1.3", timings_ms: { ground: 1300, total: 1300 }, cost_usd: 0,
    } });
  }
  if (/\/v1\/refine/.test(url)) {
    await new Promise((r) => setTimeout(r, 1800));
    const { x1, y1, x2, y2 } = target.box, w = x2 - x1 + 12, h = y2 - y1 + 12, r = 10;
    return route.fulfill({ json: {
      mode: "outline", origin: { x: x1 - 6, y: y1 - 6 }, box: target.box, timings_ms: { sam: 900, total: 900 }, cost_usd: 0,
      svg_path: `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`,
    } });
  }
  if (/\/v1\/guides/.test(url)) return route.continue(); // local backend, no Meta call
  blocked.push(url);
  return route.abort();
});

try {
  // 1. Landing.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await pause(page, 1600); // highlighter stroke + ring draw
  await shot(page, "1-landing-hero");
  const ring = await page.locator(".hero-ring").boundingBox();
  check("Landing", "hero ring drawn on the first screen", !!ring && ring.y + ring.height < VH, `ring bottom ${ring && Math.round(ring.y + ring.height)}px`);
  for (const sel of ["#how", "#privacy", "#accuracy", "#families", "#companies"]) {
    await scrollTo(page, await sectionTop(page, sel));
    await shot(page, `1-landing-${sel.slice(1)}`);
  }
  check("Landing", '"For remote helpers" section present', (await page.locator("#families").innerText()).includes("For remote helpers"));
  const L = await probe(page);
  check("Landing", "no horizontal overflow", L.overflow <= 0, `${L.overflow}px`);
  check("Landing", "touch targets >= 44 px", L.small.length === 0, JSON.stringify(L.small));
  await pause(page, 1500);

  // 2. Start screen via the hero button.
  await scrollTo(page, 0);
  await page.getByRole("link", { name: "Try it with a screenshot" }).first().tap();
  await page.getByTestId("goal-input").waitFor();
  const header = await page.locator("header").boundingBox();
  check("Header", "controls fit one row (<= 120 px)", !!header && header.height <= 120, `${header && Math.round(header.height)}px`);
  check("Start", "helper subcopy shown", await page.getByText("Turn a screenshot into a step-by-step guide you or someone you help can follow.").isVisible());
  const sample = await page.getByTestId("sample-demo-btn").boundingBox();
  check("Start", "example button on the first screen", !!sample && sample.y + sample.height <= VH, `bottom ${sample && Math.round(sample.y + sample.height)}px`);
  const S = await probe(page);
  check("Start", "touch targets >= 44 px", S.small.length === 0, JSON.stringify(S.small));
  await shot(page, "2-start");
  await page.getByTestId("sample-demo-btn").tap();

  // 3. Privacy review.
  await page.getByTestId("review-image").waitFor({ timeout: 30_000 });
  await pause(page, 1200);
  await shot(page, "3-review");
  const hidden = page.getByTestId("hidden-region");
  const autoCount = await hidden.count();
  const locks = await page.locator("[data-testid=hidden-region] svg").count();
  check("Review", "OCR auto-hid private details with lock glyphs", autoCount > 0 && locks === autoCount, `${autoCount} blocks, ${locks} locks; copy: "${await page.locator("h2 + p").first().innerText()}"`);
  const cancel = page.locator('[data-testid=ocr-line][aria-label*="Cancel subscription"]').first();
  if (await cancel.count()) {
    const [l, t, w, h] = (await cancel.evaluate((e) => [e.style.left, e.style.top, e.style.width, e.style.height].map(parseFloat))).map((v, i) => (v / 100) * (i % 2 ? 800 : 1280));
    const hasUpdate = await cancel.evaluate((e) => /update\s+payment/i.test(e.getAttribute("aria-label") || ""));
    const xLeft = hasUpdate ? l + w * 0.55 : l;
    const xRight = l + w;
    target = { label: "Cancel subscription", point: { x: Math.round((xLeft + xRight) / 2), y: Math.round(t + h / 2) }, box: { x1: Math.round(xLeft - 6), y1: Math.round(t - 8), x2: Math.round(xRight + 6), y2: Math.round(t + h + 8) } };
  }
  // Brush: a real finger drag over the lower right of the picture.
  await page.getByTestId("brush-toggle").tap();
  await page.getByTestId("review-image").scrollIntoViewIfNeeded();
  const img = await page.getByTestId("review-image").boundingBox();
  const cdp = await context.newCDPSession(page);
  const at = (f) => [{ x: img.x + img.width * (0.55 + f * 0.3), y: img.y + img.height * (0.86 + f * 0.08) }];
  let n = await hidden.count();
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) });
  for (let i = 1; i <= 10; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i / 10) }); await pause(page, 60); }
  await shot(page, "3-brush-dragging");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  check("Review", "brush drag adds a hidden block", (await hidden.count()) === n + 1);
  await page.getByTestId("brush-toggle").tap();
  // Near-tap: 12 px below a visible text line that is not the target.
  const line = page.locator('[data-testid=ocr-line]:not([aria-label*="Cancel"])').nth(2);
  const lb = await line.boundingBox();
  n = await hidden.count();
  await page.touchscreen.tap(lb.x + lb.width / 2, lb.y + lb.height + 12);
  check("Review", "thumb tap 12 px off a thin line hides it", (await hidden.count()) === n + 1, `line ${Math.round(lb.height)}px tall`);
  await shot(page, "3-review-after-edits");
  const R = await probe(page);
  check("Review", "touch targets >= 44 px", R.small.length === 0, JSON.stringify(R.small));
  const cont = page.getByTestId("review-continue");
  await cont.scrollIntoViewIfNeeded();
  check("Review", '"Looks private. Continue" enabled', await cont.isEnabled());
  await cont.tap();

  // 4. Step view with the docked card.
  await page.getByTestId("progress-text").waitFor();
  await shot(page, "4-looking");
  await page.getByTestId("step-instruction").waitFor();
  await pause(page, 700);
  await shot(page, "4-step-box");
  check("Step", "ring and badge drawn on the target", (await page.getByTestId("overlay-svg").count()) === 1 && (await page.getByTestId("step-badge").isVisible()));
  const badgeAt = await page.getByTestId("step-badge").evaluate((e) => { const r = e.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), scrollY: Math.round(scrollY), docH: document.documentElement.scrollHeight, vh: innerHeight }; });
  check("Step", "badge in view after auto-scroll", badgeAt.top >= 0 && badgeAt.bottom <= badgeAt.vh * 0.6, JSON.stringify(badgeAt));
  await page.locator(".refine-fade").waitFor({ timeout: 10_000 });
  await pause(page, 600);
  await shot(page, "4-step-outline");
  check("Step", "SAM outline replaced the box", (await page.locator(".refine-fade path").count()) === 3);
  const card = await page.getByTestId("step-instruction").locator("..").innerText();
  check("Step", 'card shows "Step 1"', /Step 1/.test(card));
  const banner = await page.getByTestId("caution-banner").innerText();
  check("Step", 'caution banner reads "Careful:" once', (banner.match(/careful:/gi) ?? []).length === 1, banner);
  const next = await page.getByTestId("next-btn").boundingBox();
  check("Step", '"I did it, next" on screen without scrolling', !!next && next.y >= 0 && next.y + next.height <= VH, `bottom ${next && Math.round(next.y + next.height)}px`);
  const sheet = await page.getByTestId("step-instruction").locator("..").boundingBox();
  check("Step", "docked card leaves >= 50% of the screen for the picture", !!sheet && sheet.height <= VH * 0.5, `card ${sheet && Math.round(sheet.height)}px of ${VH}`);
  const P = await probe(page);
  check("Step", "touch targets >= 44 px", P.small.length === 0, JSON.stringify(P.small));
  const early = page.getByTestId("share-early-btn");
  await early.scrollIntoViewIfNeeded();
  check("Share", "early share button present", await early.isVisible(), await early.innerText());
  await shot(page, "4-step-secondary");
  await early.tap();

  // 5. Share screen.
  await page.getByTestId("share-image-0").waitFor();
  await shot(page, "5-share");
  const create = page.getByTestId("create-link");
  check("Share", "Create link disabled before review + consent", await create.isDisabled());
  await page.getByTestId("share-check-0").tap();
  await page.getByTestId("share-consent").tap();
  await create.scrollIntoViewIfNeeded();
  await create.tap();
  const url = page.getByTestId("guide-url");
  const ok = await url.waitFor({ timeout: 15_000 }).then(() => true, () => false);
  const shareErr = ok ? "" : await page.locator('[role=alert]').innerText().catch(() => "no alert");
  check("Share", "local API created a 7-day link", ok, ok ? `${await url.innerText()} | ${await page.getByTestId("guide-expiry").innerText()}` : shareErr);
  if (ok) check("Share", "copy button shown", await page.getByTestId("copy-link").isVisible());
  await shot(page, "5-share-created");
  await page.getByTestId("share-back").scrollIntoViewIfNeeded();
  await page.getByTestId("share-back").tap();
  check("Share", '"Back to your steps" returns to the step', await page.getByTestId("step-instruction").isVisible());

  // 6. Eval dashboard.
  await page.goto(`${BASE}/eval`, { waitUntil: "networkidle" });
  await shot(page, "6-eval");
  const region = page.getByRole("region", { name: "Evaluation runs" });
  const extra = await region.evaluate((e) => e.scrollWidth - e.clientWidth);
  const E = await probe(page);
  check("Eval", "table scrolls inside its region, not the page", E.overflow <= 0, `table extra ${extra}px, page overflow ${E.overflow}px`);
  const acc = await page.getByRole("columnheader", { name: "Accuracy" }).boundingBox();
  const suite = await page.getByRole("columnheader", { name: "Suite" }).boundingBox();
  check("Eval", "Suite and Accuracy visible without scrolling the table", !!acc && !!suite && acc.x + acc.width <= 393, `Accuracy right edge ${acc && Math.round(acc.x + acc.width)}px`);
  await region.focus();
  check("Eval", "table region focusable with a visible ring", (await region.evaluate((e) => getComputedStyle(e).outlineStyle)) === "solid");
  await region.evaluate((e) => e.scrollTo({ left: e.scrollWidth, behavior: "smooth" }));
  await pause(page, 1000);
  await page.locator("#e2e").scrollIntoViewIfNeeded();
  await shot(page, "6-eval-e2e");
  check("Eval", "touch targets >= 44 px", E.small.length === 0, JSON.stringify(E.small));

  check("All", "no request outside the mock and local guides API", blocked.length === 0, blocked.join(", "));
  check("All", "no console errors", errors.length === 0, errors.slice(0, 3).join(" | "));
  await pause(page, 2000);
} finally {
  fs.writeFileSync(path.join(OUT, "demo-report.json"), JSON.stringify({ base: BASE, results, errors, blocked }, null, 2));
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed. Screenshots + demo-report.json in ${OUT}`);
  await browser.close();
}
