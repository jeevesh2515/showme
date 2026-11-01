// Offline: static HTML fixtures, no network. Run: node --test eval/e2e/predicate.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { predicateHolds } from "./predicate.mjs";

const { chromium } = createRequire(new URL("../../apps/web/package.json", import.meta.url))("@playwright/test");
const HERE = dirname(fileURLToPath(import.meta.url));
const line = readFileSync(join(HERE, "tasks.yaml"), "utf8").match(/^\s+selector: '(.*)'$/m)[1];
const predicate = { type: "selector", selector: line };
const title = `<h1>Rick Astley - Never Gonna Give You Up (Official Video)</h1><div class="html5-video-player"><div class="ytp-caption-window-container"></div></div>`;

let browser;
test.before(async () => (browser = await chromium.launch()));
test.after(async () => browser.close());

async function holds(html, pred = predicate) {
  const page = await browser.newPage();
  await page.setContent(html);
  const r = await predicateHolds(page, pred);
  await page.close();
  return r;
}

test("title visible, captions off: false", async () => {
  assert.equal(await holds(`${title}<button class="ytp-subtitles-button" aria-pressed="false"></button>`), false);
});
test("consent overlay + title: false", async () => {
  assert.equal(await holds(`<div id="consent">Before you continue to YouTube</div>${title}`), false);
});
test("old text predicate was a false positive on title", async () => {
  assert.equal(await holds(title, { type: "text_visible", pattern: "never gonna give you up" }), true);
});
test("captions button pressed: true", async () => {
  assert.equal(await holds(`${title}<button class="ytp-subtitles-button" aria-pressed="true"></button>`), true);
});
test("caption segment rendered: true", async () => {
  assert.equal(await holds(`<div class="ytp-caption-window-container"><span class="ytp-caption-segment">We're no strangers</span></div>`), true);
});
test("caption segment present but hidden: false", async () => {
  assert.equal(await holds(`${title}<span class="ytp-caption-segment" style="display:none">We're no strangers</span>`), false);
});
test("caption segment visible but empty: false", async () => {
  assert.equal(await holds(`${title}<div class="caption-window"><span class="captions-text"> </span></div>`), false);
});
test("mobile captions text visible: true", async () => {
  assert.equal(await holds(`<div class="caption-window"><span class="captions-text">We're no strangers</span></div>`), true);
});
test("bbc cookie: reject (000) true, accept (111) false", async () => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const pred = { type: "cookie", name: "ckns_policy", pattern: "^000$" };
  await ctx.addCookies([{ name: "ckns_policy", value: "111", url: "https://www.bbc.co.uk/" }]);
  assert.equal(await predicateHolds(page, pred), false);
  await ctx.addCookies([{ name: "ckns_policy", value: "000", url: "https://www.bbc.co.uk/" }]);
  assert.equal(await predicateHolds(page, pred), true);
  await ctx.close();
});
test("tasks.yaml url predicates reject search-result URLs", () => {
  const yaml = readFileSync(join(HERE, "tasks.yaml"), "utf8");
  const pat = (id) => new RegExp(yaml.split(`id: ${id}`)[1].match(/pattern: "(.*)"/)[1].replaceAll("\\\\", "\\"), "i");
  assert.equal(pat("e2e-09-ikea-returns").test("https://www.ikea.com/gb/en/search/?q=returns"), false);
  assert.equal(pat("e2e-09-ikea-returns").test("https://www.ikea.com/gb/en/customer-service/returns-claims/returns/"), true);
  assert.equal(pat("e2e-12-gmail-password").test("https://accounts.google.com/signin"), false);
});
