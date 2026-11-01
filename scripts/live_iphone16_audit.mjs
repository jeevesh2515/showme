// Live, headed iPhone 16 audit of the ShowMe web app (landing -> a11y -> /app -> review -> step -> /eval).
// Every /api/v1/step and /api/v1/refine call is mocked by route interception: no Meta API call, $0.
// Usage: node scripts/live_iphone16_audit.mjs [baseURL] [outDir]
// shortcut: runs Chromium with the iPhone 16 profile (no WebKit installed); upgrade with `playwright install webkit`.
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium, devices } = createRequire(path.join(root, "apps/web/package.json"))("@playwright/test");
const BASE = process.argv[2] ?? "http://localhost:3000";
const OUT = path.resolve(process.argv[3] ?? path.join(os.tmpdir(), "showme-live-audit"));
const SHOT = path.join(root, "spikes/redaction/fixtures/billing.png"); // synthetic data, 1280x800
const SLOW = Number(process.env.SLOWMO ?? 600);
fs.mkdirSync(OUT, { recursive: true });

const report = { base: BASE, device: "iPhone 16", engine: "chromium", steps: {}, checks: [], consoleErrors: [] };
const check = (step, name, pass, detail = "") => {
  report.checks.push({ step, name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} [${step}] ${name}${detail ? ` :: ${detail}` : ""}`);
};

// Runs in the page: overflow, touch targets < 44 px, text contrast against the effective background.
function probe() {
  const lum = (c) => {
    const m = c.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
    const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
  };
  const alpha = (c) => (c.startsWith("rgba") ? Number(c.match(/[\d.]+/g)[3]) : 1);
  const bgOf = (el) => {
    for (let e = el; e; e = e.parentElement) {
      const b = getComputedStyle(e).backgroundColor;
      if (alpha(b) > 0.5) return b;
    }
    return "rgb(255, 255, 255)";
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && !el.closest(".sr-only");
  };
  const small = [];
  for (const el of document.querySelectorAll("a, button, summary, input:not([type=file]), [data-testid=drop-zone]")) {
    if (!visible(el)) continue;
    const r = el.getBoundingClientRect();
    const inline = el.tagName === "A" && el.closest("p, li") && getComputedStyle(el).display === "inline";
    if (r.height < 44 || r.width < 44) small.push({ el: (el.innerText || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 40), w: Math.round(r.width), h: Math.round(r.height), inline: !!inline });
  }
  const low = [];
  let min = 99;
  for (const el of document.querySelectorAll("body *")) {
    if (!visible(el) || !["P", "SPAN", "A", "BUTTON", "LABEL", "H1", "H2", "LI", "STRONG", "TD", "TH", "SUMMARY", "CODE"].includes(el.tagName)) continue;
    if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    const s = getComputedStyle(el);
    if (Number(s.opacity) < 1) continue;
    const a = lum(s.color), b = lum(bgOf(el));
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    min = Math.min(min, ratio);
    if (ratio < 4.5) low.push({ text: el.textContent.trim().slice(0, 40), ratio: +ratio.toFixed(2), fg: s.color, bg: bgOf(el) });
  }
  return {
    overflowX: document.documentElement.scrollWidth - screen.width, // mobile layout viewport grows to fit overflow; device width does not
    smallTargets: small,
    minContrast: +min.toFixed(2),
    lowContrast: low,
    minFontPx: Math.min(...[...document.querySelectorAll("body *")].filter((e) => visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())).map((e) => parseFloat(getComputedStyle(e).fontSize))),
  };
}

const shot = (page, name) => page.screenshot({ path: path.join(OUT, `${name}.png`) });
const smoothScroll = (page, to) => page.evaluate((y) => new Promise((r) => { window.scrollTo({ top: y, behavior: "smooth" }); setTimeout(r, 900); }), to);

const browser = await chromium.launch({ headless: false, slowMo: SLOW });
const context = await browser.newContext({ ...devices["iPhone 16"], locale: "en-GB" });
const page = await context.newPage();
const VH = page.viewportSize().height; // 659 on iPhone 16: the visible area under Safari toolbars, not the 852 screen
page.on("pageerror", (e) => report.consoleErrors.push(String(e)));
page.on("console", (m) => m.type() === "error" && report.consoleErrors.push(m.text()));

// Mock the backend: step returns a caution step pointing at the OCR'd "Cancel subscription" line; refine returns a SAM outline.
let target = { label: "Cancel subscription", point: { x: 640, y: 400 }, box: { x1: 560, y1: 380, x2: 720, y2: 420 } };
const realCalls = [];
await page.route("**/api/v1/step*", async (route) => {
  await new Promise((r) => setTimeout(r, 1800)); // let "Looking at your screen" be seen
  await route.fulfill({ json: {
    step_id: "live_1", status: "ok", action: "tap", instruction: 'Tap "Cancel subscription", the button under your plan details.',
    target, scroll_direction: "none", type_text: "", confidence: 0.95, goal_complete: false, model: "muse-spark-1.3",
    caution: "Careful: cancelling ends your plan at the end of this month.", timings_ms: { ground: 1300, total: 1300 }, cost_usd: 0,
  } });
});
await page.route("**/api/v1/refine*", async (route) => {
  await new Promise((r) => setTimeout(r, 2000)); // box first, then the outline crossfade
  const { x1, y1, x2, y2 } = target.box, w = x2 - x1 + 12, h = y2 - y1 + 12, r = 10;
  await route.fulfill({ json: {
    mode: "outline", origin: { x: x1 - 6, y: y1 - 6 }, box: target.box, timings_ms: { sam: 900, total: 900 }, cost_usd: 0,
    svg_path: `M ${r} 0 H ${w - r} Q ${w} 0 ${w} ${r} V ${h - r} Q ${w} ${h} ${w - r} ${h} H ${r} Q 0 ${h} 0 ${h - r} V ${r} Q 0 0 ${r} 0 Z`,
  } });
});
await page.route("**/api/**", (route) => { const u = route.request().url(); if (/\/v1\/(step|refine)/.test(u)) return route.fallback(); realCalls.push(u); return route.abort(); });

try {
  // Step A: landing.
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500); // hero ring draws (300 ms delay + 900 ms)
  await shot(page, "A1-hero");
  const A = await page.evaluate(probe);
  report.steps.A = A;
  const hero = await page.locator("main h1").boundingBox();
  check("A", "hero headline above the fold", !!hero && hero.y + hero.height < VH, `h1 bottom ${hero && Math.round(hero.y + hero.height)}px`);
  const ringBox = await page.locator(".hero-ring").boundingBox();
  const demoBox = await page.getByRole("group", { name: /Example: ShowMe highlighting/ }).boundingBox();
  check("A", "hero demo card starts above 550 px", !!demoBox && demoBox.y < 550, `demo top ${demoBox && Math.round(demoBox.y)}px`);
  check("A", "hero ring drawn on the first screen", !!ringBox && ringBox.y + ringBox.height < VH, `ring bottom ${ringBox && Math.round(ringBox.y + ringBox.height)}px`);
  for (const id of ["how", "privacy", "accuracy", "families", "companies", "models"]) {
    const y = await page.locator(`#${id}`).evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 80);
    await smoothScroll(page, y);
    await shot(page, `A-${id}`);
  }
  check("A", "no horizontal overflow at 393 px", A.overflowX <= 0, `overflow ${A.overflowX}px`);
  check("A", "min text contrast >= 4.5", A.minContrast >= 4.5, `min ${A.minContrast}`);
  check("A", "min font size >= 18 px", A.minFontPx >= 18, `min ${A.minFontPx}px`);
  check("A", "touch targets >= 44 px (non-inline)", A.smallTargets.filter((t) => !t.inline).length === 0, JSON.stringify(A.smallTargets.filter((t) => !t.inline)));

  // Step B: header + accessibility.
  await smoothScroll(page, 0);
  const header = page.locator("header").first();
  const hb = await header.boundingBox();
  report.steps.B = { headerHeight: hb && Math.round(hb.height) };
  await shot(page, "B0-header-100");
  for (const s of [125, 150]) {
    await page.getByTestId(`text-size-${s}`).tap();
    await page.waitForTimeout(500);
    await shot(page, `B-text-${s}`);
    const p = await page.evaluate(probe);
    const h = await header.boundingBox();
    report.steps.B[`t${s}`] = { overflowX: p.overflowX, headerHeight: h && Math.round(h.height) };
    check("B", `no horizontal overflow at ${s}%`, p.overflowX <= 0, `overflow ${p.overflowX}px, header ${h && Math.round(h.height)}px`);
    await smoothScroll(page, 1400);
    await shot(page, `B-text-${s}-scrolled`);
    await smoothScroll(page, 0);
  }
  await page.getByTestId("contrast-toggle").tap();
  const hc = await page.evaluate(() => ({
    sage: getComputedStyle(document.querySelector("section.bg-sage")).backgroundColor,
    sun: getComputedStyle(document.querySelector("#families").closest("section")).backgroundColor,
    familiesBorder: getComputedStyle(document.querySelector("#families").closest("section")).borderTopWidth,
    privacyBorder: getComputedStyle(document.querySelector("section.bg-sage")).borderTopWidth,
  }));
  report.steps.B.highContrast = hc;
  check("B", "high contrast: tints become white", hc.sage === "rgb(255, 255, 255)" && hc.sun === "rgb(255, 255, 255)", JSON.stringify(hc));
  check("B", "high contrast: tinted cards keep a visible border", hc.familiesBorder !== "0px", `families border ${hc.familiesBorder}, privacy border ${hc.privacyBorder}`);
  for (const id of ["privacy", "families"]) {
    await smoothScroll(page, await page.locator(`#${id}`).evaluate((e) => e.getBoundingClientRect().top + window.scrollY - 80));
    await shot(page, `B-hc-${id}`);
  }
  await page.getByTestId("contrast-toggle").tap();
  await page.getByTestId("text-size-100").tap();

  // Step C: /app upload. Text size is tab state, so it resets on navigation (expected).
  await page.goto(`${BASE}/app`, { waitUntil: "networkidle" });
  await shot(page, "C1-start");
  const C = await page.evaluate(probe);
  report.steps.C = C;
  const choose = await page.getByText("Choose a picture").boundingBox();
  check("C", "'Choose a picture' visible without scrolling", !!choose && choose.y + choose.height < VH, `bottom ${choose && Math.round(choose.y + choose.height)}px`);
  const sample = await page.getByTestId("sample-demo-btn").boundingBox();
  check("C", "'Try with an example' button on the first screen", !!sample && sample.y + sample.height < VH, `bottom ${sample && Math.round(sample.y + sample.height)}px`);
  check("C", "touch targets >= 44 px", C.smallTargets.filter((t) => !t.inline).length === 0, JSON.stringify(C.smallTargets));
  await page.getByTestId("goal-input").tap();
  await page.getByTestId("goal-input").pressSequentially("cancel my subscription", { delay: 60 });
  await page.getByTestId("drop-zone").dispatchEvent("dragover", { dataTransfer: await page.evaluateHandle(() => new DataTransfer()) });
  await page.waitForTimeout(600);
  const dragBg = await page.getByTestId("drop-zone").evaluate((e) => getComputedStyle(e).backgroundColor);
  await shot(page, "C2-drag-hover");
  check("C", "drop zone shows drag state (sun tint)", dragBg === "rgb(255, 244, 194)", dragBg);
  await page.getByTestId("drop-zone").dispatchEvent("dragleave");
  await page.getByTestId("file-input").setInputFiles(SHOT);

  // Step D: privacy review.
  await page.getByTestId("review-image").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(800);
  await shot(page, "D1-review");
  const D = await page.evaluate(probe);
  report.steps.D = D;
  const heading = await page.locator("h2").first().innerText();
  const summary = await page.locator("h2 + p").first().innerText();
  const autoBlocks = await page.getByTestId("hidden-region").count();
  const lockGlyphs = await page.locator("[data-testid=hidden-region] svg").count();
  const lines = await page.getByTestId("ocr-line").count();
  report.steps.D.counts = { autoBlocks, lockGlyphs, ocrLines: lines, summary };
  check("D", "auto-redaction found PII blocks", autoBlocks > 0, `${autoBlocks} blocks, copy: "${summary}"`);
  check("D", "auto blocks carry a lock glyph (DESIGN §4.2)", lockGlyphs > 0, `${lockGlyphs} glyphs`);
  const contBox = await page.getByTestId("review-continue").boundingBox();
  check("D", "Continue reachable without scrolling", !!contBox && contBox.y + contBox.height < VH, `Continue top ${contBox && Math.round(contBox.y)}px (viewport ${VH})`);
  // Find the target line for the mocked step, in image pixels.
  const cancel = page.locator('[data-testid=ocr-line][aria-label*="Cancel subscription"]').first();
  if (await cancel.count()) {
    const pct = await cancel.evaluate((e) => [e.style.left, e.style.top, e.style.width, e.style.height].map(parseFloat));
    const [l, t, w, h] = pct.map((v, i) => (v / 100) * (i % 2 ? 800 : 1280));
    const hasUpdate = await cancel.evaluate((e) => /update\s+payment/i.test(e.getAttribute("aria-label") || ""));
    const xLeft = hasUpdate ? l + w * 0.55 : l;
    const xRight = l + w;
    target = { label: "Cancel subscription", point: { x: Math.round((xLeft + xRight) / 2), y: Math.round(t + h / 2) }, box: { x1: Math.round(xLeft - 6), y1: Math.round(t - 8), x2: Math.round(xRight + 6), y2: Math.round(t + h + 8) } };
  }
  // Tap a plain text line to hide it.
  const before = await page.getByTestId("hidden-region").count();
  const plain = page.locator('[data-testid=ocr-line]:not([aria-label*="Cancel"])').nth(1);
  await plain.scrollIntoViewIfNeeded();
  // Thumb tap 15 px below a thin line (2-7 px tall at phone scale) must still hide it.
  const lb = await plain.boundingBox();
  await page.touchscreen.tap(lb.x + lb.width / 2, lb.y + lb.height + 15);
  check("D", "thumb tap 15 px off a thin text line hides it", (await page.getByTestId("hidden-region").count()) === before + 1, `line height ${Math.round(lb.height)}px`);
  await shot(page, "D2-line-hidden");
  // Brush: a real finger drag (CDP touch events) over the image.
  await page.getByTestId("brush-toggle").tap();
  await page.getByTestId("review-image").scrollIntoViewIfNeeded();
  const img = await page.getByTestId("review-image").boundingBox();
  if (img) {
    const cdp = await context.newCDPSession(page);
    const at = (f) => [{ x: img.x + img.width * (0.55 + f * 0.3), y: img.y + img.height * (0.85 + f * 0.1) }];
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: at(0) });
    for (let i = 1; i <= 10; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: at(i / 10) }); await page.waitForTimeout(60); }
    await shot(page, "D3-brush-dragging");
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  }
  check("D", "brush adds a manual block", (await page.getByTestId("hidden-region").count()) === before + 2);
  await shot(page, "D3-brushed");
  await page.getByTestId("brush-toggle").tap();
  await page.getByTestId("undo-btn").tap();
  check("D", "undo removes the last block", (await page.getByTestId("hidden-region").count()) === before + 1);
  await page.getByTestId("zoom-in").tap();
  await page.getByTestId("zoom-in").tap();
  await shot(page, "D4-zoom-150");
  const zoomOverflow = await page.evaluate(() => document.documentElement.scrollWidth - screen.width);
  check("D", "zoom stays inside its scroll box (no page overflow)", zoomOverflow <= 0, `page overflow ${zoomOverflow}px`);
  await page.getByTestId("zoom-out").tap();
  await page.getByTestId("zoom-out").tap();
  await page.getByTestId("review-continue").scrollIntoViewIfNeeded();
  await page.getByTestId("review-continue").tap();

  // Step E: step view, box first, then SAM outline crossfade.
  await page.getByTestId("progress-text").waitFor();
  await shot(page, "E0-looking");
  await page.getByTestId("step-instruction").waitFor();
  await page.waitForTimeout(400);
  await shot(page, "E1-step-box");
  const E = await page.evaluate(probe);
  report.steps.E = E;
  const card = await page.getByTestId("step-instruction").locator("..").innerText();
  check("E", 'card shows "Step 1"', /Step 1/.test(card));
  const banner = await page.getByTestId("caution-banner").innerText();
  check("E", 'no duplicate "Careful: Careful:"', !/careful:\s*careful:/i.test(banner), banner);
  check("E", "overlay ring + badge present", (await page.getByTestId("overlay-svg").count()) === 1 && (await page.getByTestId("step-badge").count()) === 1);
  await page.locator(".refine-fade").waitFor({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await shot(page, "E2-step-outline");
  check("E", "SAM outline replaced the box", (await page.locator(".refine-fade path").count()) === 3);
  const svgBox = await page.getByTestId("overlay-svg").boundingBox();
  const nextBox = await page.getByTestId("next-btn").boundingBox();
  report.steps.E.layout = { imageBottom: svgBox && Math.round(svgBox.y + svgBox.height), nextTop: nextBox && Math.round(nextBox.y) };
  check("E", "'I did it, next' visible with the ring (no scroll)", !!nextBox && nextBox.y + nextBox.height < VH, `next top ${nextBox && Math.round(nextBox.y)}px`);
  await page.mouse.wheel(0, -3000);
  await page.waitForTimeout(500);
  const docked = await page.getByTestId("next-btn").boundingBox();
  check("E", "step card docked: 'I did it, next' stays on screen when scrolled to top", !!docked && docked.y + docked.height <= VH, `next bottom ${docked && Math.round(docked.y + docked.height)}px`);
  check("E", "touch targets >= 44 px", E.smallTargets.filter((t) => !t.inline).length === 0, JSON.stringify(E.smallTargets));
  await page.getByTestId("next-btn").scrollIntoViewIfNeeded();
  await shot(page, "E3-step-card");

  // Step F: /eval.
  await page.goto(`${BASE}/eval`, { waitUntil: "networkidle" });
  await shot(page, "F1-eval");
  const F = await page.evaluate(probe);
  report.steps.F = F;
  const region = page.getByRole("region", { name: "Evaluation runs" });
  const scrollable = await region.evaluate((e) => e.scrollWidth - e.clientWidth);
  check("F", "table scrolls inside its region, not the page", F.overflowX <= 0, `table extra ${scrollable}px, page overflow ${F.overflowX}px`);
  const acc = await page.getByRole("columnheader", { name: "Accuracy" }).boundingBox();
  check("F", "Accuracy column visible without scrolling the table", !!acc && acc.x + acc.width <= 393, `right edge ${acc && Math.round(acc.x + acc.width)}px`);
  await region.focus();
  const focusStyle = await region.evaluate((e) => getComputedStyle(e).outlineStyle + " " + getComputedStyle(e).outlineColor);
  check("F", "table region is keyboard focusable with visible ring", focusStyle.startsWith("solid"), focusStyle);
  await region.evaluate((e) => e.scrollTo({ left: e.scrollWidth, behavior: "smooth" }));
  await page.waitForTimeout(900);
  await shot(page, "F2-table-scrolled");
  await page.locator("#e2e").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot(page, "F3-e2e-band");
  check("F", "min text contrast >= 4.5", F.minContrast >= 4.5, `min ${F.minContrast}`);
  check("ALL", "no real /api calls escaped the mock", realCalls.length === 0, realCalls.join(", "));
  check("ALL", "no console errors", report.consoleErrors.length === 0, report.consoleErrors.slice(0, 3).join(" | "));
  await page.waitForTimeout(2500);
} finally {
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  const failed = report.checks.filter((c) => !c.pass).length;
  console.log(`\n${report.checks.length - failed}/${report.checks.length} checks passed. Screenshots + report.json in ${OUT}`);
  await browser.close();
}
