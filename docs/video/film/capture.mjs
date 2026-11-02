// Records the genuine product flow from the live site as high-resolution frames plus timed marks.
// Rehearse free with MOCK=1 (model and share calls stubbed, footage never used in the film).
// Live: one step and refine (main), plus one step (not-visible). Prints what it spent.
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { Buffer } from "node:buffer";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const { chromium } = createRequire(join(root, "apps/web/package.json"))("@playwright/test");
const WEB = process.env.BASE_URL ?? "https://showme-web-delta.vercel.app";
const MOCK = process.env.MOCK === "1";
const OUT = process.env.OUT ?? join(here, "../out/raw");
const ONLY = process.env.ONLY; // main | phone | absent
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const spent = [];

const CURSOR = () => {
  const add = () => {
    if (document.getElementById("__demo_cursor") || !document.body) return;
    const c = document.createElement("div");
    c.id = "__demo_cursor";
    c.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:60px;height:60px;zoom:.5;transform:translate(-100px,-100px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))";
    c.innerHTML = '<svg viewBox="0 0 24 24" width="60" height="60"><path d="M4 2l15 11-7 1 4 8-3 1-4-8-5 5z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
    document.body.appendChild(c);
  };
  if (document.body) add(); else document.addEventListener("DOMContentLoaded", add);
};

async function session(browser, name, contextOptions) {
  const dir = join(OUT, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const context = await browser.newContext(contextOptions);
  await context.addInitScript(CURSOR);
  // Screencast ignores deviceScaleFactor, so desktop renders at 2x through CSS zoom: same layout as 1280x720, sharper pixels.
  if (contextOptions.viewport.width === 2560) await context.addInitScript(() => { const z = () => { if (document.body) document.body.style.zoom = "2"; else requestAnimationFrame(z); }; z(); });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const frames = [];
  const marks = [];
  cdp.on("Page.screencastFrame", ({ data, metadata, sessionId }) => {
    const n = frames.length;
    writeFileSync(join(dir, `f${String(n).padStart(6, "0")}.jpg`), Buffer.from(data, "base64"));
    frames.push({ n, t: metadata.timestamp });
    cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  const start = () => cdp.send("Page.startScreencast", { format: "jpeg", quality: 92, maxWidth: contextOptions.viewport.width, maxHeight: contextOptions.viewport.height, everyNthFrame: 1 });
  const mark = (id) => { marks.push({ id, t: Date.now() / 1000 }); console.log(`mark ${name}: ${id}`); };
  const finish = async () => {
    await cdp.send("Page.stopScreencast");
    writeFileSync(join(dir, "timeline.json"), JSON.stringify({ frames, marks }, null, 1));
    await context.close();
  };
  let pos = { x: 1400, y: 800 };
  const glide = async (x, y, ms = 650) => {
    const from = pos;
    await page.evaluate(([f, t, d]) => new Promise((res) => {
      const c = document.getElementById("__demo_cursor");
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / d);
        const e = k * k * (3 - 2 * k);
        if (c) c.style.transform = `translate(${f.x + (t.x - f.x) * e}px,${f.y + (t.y - f.y) * e}px)`;
        if (k < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    }), [from, { x, y }, ms]);
    await page.mouse.move(x, y);
    pos = { x, y };
  };
  const center = async (loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const click = async (loc, ms) => { const c = await center(loc); await glide(c.x, c.y, ms); await sleep(180); await page.mouse.down(); await sleep(70); await page.mouse.up(); };
  return { page, start, mark, finish, glide, click, center, dir, spawnDelay: sleep };
}

function watchSpend(page, label) {
  page.on("response", async (res) => {
    const u = res.url();
    if (res.request().method() !== "POST" || !/\/api\/v1\/(step|refine)/.test(u)) return;
    const body = await res.json().catch(() => null);
    console.log(`${label} ${u.split("/").pop()} http=${res.status()} status=${body?.status ?? body?.mode} cost=${body?.cost_usd}`);
    if (typeof body?.cost_usd === "number") spent.push(body.cost_usd);
    writeFileSync(join(OUT, `${label}-${u.split("/").pop()}-response.json`), JSON.stringify(body, null, 1));
  });
  page.on("response", async (res) => {
    if (res.request().method() === "POST" && res.url().endsWith("/api/v1/guides")) {
      const body = await res.json().catch(() => null);
      if (body?.delete_key) writeFileSync(join(OUT, "guide-delete-key.txt"), body.delete_key); // gitignored: lets a draft guide be deleted
    }
  });
}

const STEP = { step_id: "st_x", status: "ok", action: "tap", instruction: "REHEARSAL ONLY mock instruction.", target: { label: "Cancel subscription", point: { x: 513, y: 632 }, box: { x1: 396, y1: 614, x2: 563, y2: 651 } }, scroll_direction: "none", type_text: "", caution: "", confidence: 0.9, goal_complete: false, model: "mock", timings_ms: { ground: 100 }, cost_usd: 0 };

async function mockRoutes(page) {
  await page.route("**/api/v1/step*", async (r) => { await sleep(2500); await r.fulfill({ json: STEP }); });
  await page.route("**/api/v1/refine*", async (r) => { await sleep(1200); await r.fulfill({ json: { mode: "box", svg_path: null, origin: null, box: STEP.target.box, timings_ms: { sam: 1 }, cost_usd: 0 } }); });
  await page.route("**/api/v1/guides", (r) => r.fulfill({ json: { url: `${WEB}/g/rehearsal`, delete_key: "x", expires_at: new Date(Date.now() + 7 * 864e5).toISOString() } }));
}

const browser = await chromium.launch();
try {
  let guideUrl = process.env.GUIDE_URL;
  if (!ONLY || ONLY === "main") {
    const s = await session(browser, "main", { viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1, locale: "en-GB" });
    const { page, click, glide, mark } = s;
    if (MOCK) await mockRoutes(page);
    watchSpend(page, "main");
    page.on("request", (q) => {
      if (q.method() === "POST" && q.url().includes("/api/v1/step")) {
        const img = q.postDataJSON()?.image ?? "";
        writeFileSync(join(OUT, "uploaded.jpg"), Buffer.from(img.split(",")[1] ?? "", "base64"));
        writeFileSync(join(OUT, "uploaded-meta.json"), JSON.stringify({ goal: q.postDataJSON()?.goal, header: img.slice(0, 30), keys: Object.keys(q.postDataJSON() ?? {}) }, null, 1));
      }
    });
    await page.goto(`${WEB}/app`, { waitUntil: "networkidle" });
    await s.start();
    await sleep(500);
    mark("app");
    await click(page.getByTestId("goal-input"), 800);
    await page.keyboard.type("Cancel my subscription", { delay: 55 });
    await sleep(350);
    mark("sample");
    await click(page.getByTestId("sample-demo-btn"), 800);
    await page.getByTestId("review-image").waitFor({ timeout: 40_000 });
    mark("review");
    await sleep(2500);
    mark("brush");
    await click(page.getByTestId("brush-toggle"), 700);
    await sleep(300);
    const img = page.getByTestId("review-image");
    await img.scrollIntoViewIfNeeded();
    const b = await img.boundingBox();
    const at = (x, y) => ({ x: b.x + (x / 1280) * b.width, y: b.y + (y / 740) * b.height });
    const a = at(198, 246), z = at(280, 270);
    await glide(a.x, a.y, 800);
    await page.mouse.down();
    await glide(z.x, z.y, 900);
    await page.mouse.up();
    mark("brushed");
    await sleep(500);
    await click(page.getByTestId("brush-toggle"), 600);
    const tap = async (x, y, id) => { await img.scrollIntoViewIfNeeded(); const f = await img.boundingBox(); await glide(f.x + (x / 1280) * f.width, f.y + (y / 740) * f.height, 650); await sleep(150); await page.mouse.down(); await sleep(60); await page.mouse.up(); mark(id); await sleep(650); };
    if (process.env.OLD_MASK === "1") await tap(300, 335, "tap-card"); // production before D56 leaves the card's misread first group visible
    await tap(230, 413, "tap-expiry");
    await tap(300, 569, "tap-address");
    await sleep(1200);
    mark("continue");
    await click(page.getByTestId("review-continue"), 800);
    mark("looking");
    await page.getByTestId("step-instruction").waitFor({ timeout: 40_000 });
    mark("step");
    await page.waitForResponse((r) => r.url().includes("/api/v1/refine"), { timeout: 15_000 }).catch(() => {});
    mark("refined");
    await sleep(4500);
    mark("share");
    await click(page.getByTestId("share-early-btn"), 800);
    await sleep(1200);
    await click(page.getByTestId("share-check-0"), 700);
    await sleep(500);
    await click(page.getByTestId("share-consent"), 600);
    await sleep(600);
    mark("create");
    await click(page.getByTestId("create-link"), 600);
    await page.getByTestId("guide-url").waitFor({ timeout: 25_000 });
    mark("link");
    guideUrl = (await page.getByTestId("guide-url").innerText()).trim();
    await sleep(1000);
    await click(page.getByTestId("copy-link"), 600);
    await sleep(1800);
    mark("end");
    await s.finish();
    writeFileSync(join(OUT, "guide-url.txt"), guideUrl);
  }
  if ((!ONLY || ONLY === "phone") && guideUrl && !MOCK) {
    const s = await session(browser, "phone", { viewport: { width: 393, height: 760 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: "en-GB", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1" });
    // Screencast ignores deviceScaleFactor on a phone viewport, so screenshots give the real 3x frames.
    const frames = [], marks = [];
    const mark = (id) => marks.push({ id, t: Date.now() / 1000 });
    let recording = true;
    const loop = (async () => { while (recording) { const n = frames.length; await s.page.screenshot({ path: join(s.dir, `f${String(n).padStart(6, "0")}.jpg`), type: "jpeg", quality: 90 }); frames.push({ n, t: Date.now() / 1000 }); } })();
    await s.page.goto(guideUrl, { waitUntil: "load" });
    mark("open");
    await sleep(3500);
    await s.page.evaluate(() => document.querySelector('[data-testid="guide-instruction"]')?.scrollIntoView({ behavior: "smooth", block: "start" }));
    mark("ring");
    await sleep(8000);
    await s.page.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
    mark("note");
    await sleep(5000);
    mark("end");
    recording = false;
    await loop;
    writeFileSync(join(s.dir, "timeline.json"), JSON.stringify({ frames, marks }, null, 1));
    await s.page.context().close();
  }
  if ((!ONLY || ONLY === "absent")) {
    const s = await session(browser, "absent", { viewport: { width: 2560, height: 1440 }, deviceScaleFactor: 1, locale: "en-GB" });
    const { page, click, mark } = s;
    if (MOCK) await mockRoutes(page);
    watchSpend(page, "absent");
    await page.goto(`${WEB}/app`, { waitUntil: "networkidle" });
    await s.start();
    await sleep(300);
    await click(page.getByTestId("goal-input"), 500);
    await page.keyboard.type("Download my 2019 tax invoice", { delay: 45 });
    await click(page.getByTestId("sample-demo-btn"), 500);
    await page.getByTestId("review-image").waitFor({ timeout: 40_000 });
    await sleep(800);
    mark("continue");
    await click(page.getByTestId("review-continue"), 600);
    await page.getByTestId("step-instruction").waitFor({ timeout: 40_000 }).catch(() => {});
    mark("result");
    await sleep(4500);
    await page.screenshot({ path: join(OUT, "absent-final.png") });
    mark("end");
    await s.finish();
  }
} finally {
  await browser.close();
}
const total = spent.reduce((a, b) => a + b, 0);
console.log(`spent $${total.toFixed(4)} (${spent.length} priced responses)`);
writeFileSync(join(OUT, "spend.txt"), `${total}\n`);
