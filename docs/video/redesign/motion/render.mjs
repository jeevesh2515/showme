// Renders scenes frame by frame in Chromium and pipes them to FFmpeg. Fonts and images decode before every capture.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const { build, CSS, FPS } = await import(process.env.FILM_EDIT === "readable" ? "../readable/film.mjs" : process.env.FILM_EDIT === "continuity" ? "../continuity/film.mjs" : process.env.FILM_EDIT === "ink" ? "../ink/film.mjs" : process.env.FILM_EDIT === "story" ? "../rescue/film.mjs" : process.env.FILM_EDIT === "locked" ? "../locked/film.mjs" : "./film.mjs");

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../../..");
const { chromium } = createRequire(join(root, "apps/web/package.json"))("@playwright/test");

async function openPage(browser, dir) {
  const stage = join(dir, "stage.html");
  writeFileSync(stage, `<!doctype html><meta charset=utf-8><style>${CSS}</style><div id=r></div>`);
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pathToFileURL(stage).href);
  return page;
}

async function capture(page, html) {
  await page.evaluate(async (h) => {
    document.getElementById("r").innerHTML = h;
    await document.fonts.ready;
    await Promise.all([...document.images].map((i) => i.decode()));
    for (const l of document.querySelectorAll("[data-fit]")) if (l.scrollHeight > l.clientHeight + 1 || l.scrollWidth > l.clientWidth + 1) throw new Error(`Text does not fit its zone: ${l.textContent.slice(0, 80)}`);
    for (const l of document.querySelectorAll("[data-inframe]")) { const r = l.getBoundingClientRect(); if (r.left < 0 || r.right > 1920 || r.top < 0 || r.bottom > 1080) throw new Error(`Out of frame: ${l.textContent.slice(0, 80)}`); }
    for (const l of document.querySelectorAll(".lb")) if (l.scrollWidth > l.clientWidth) throw new Error(`Label overflows its band: ${l.textContent}`);
  }, html);
  return page.screenshot({ type: "jpeg", quality: 97 });
}

export const encoder = (out) => spawn("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p", "-r", String(FPS), "-an", out], { stdio: ["pipe", "inherit", "inherit"] });

async function encodeFrames(out, frames, page, overlay = () => "") {
  const ff = encoder(out);
  const done = new Promise((res, rej) => ff.on("close", (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c} for ${out}`)))));
  for (const html of frames) {
    const buf = await capture(page, html + overlay());
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  }
  ff.stdin.end();
  await done;
}

// One page per scene, so every scene is independent of the others.
export async function renderScenes(key, outDir, concurrency = 5) {
  mkdirSync(outDir, { recursive: true });
  const scenes = build(key), browser = await chromium.launch();
  const results = [];
  try {
    let next = 0;
    await Promise.all(Array.from({ length: Math.min(concurrency, scenes.length) }, async () => {
      const page = await openPage(browser, outDir);
      while (next < scenes.length) {
        const scene = scenes[next++], out = join(outDir, `${scene.name}.mp4`);
        const gen = (function* () { for (let n = 0; n < scene.frames; n++) yield scene.frameAt(n); })();
        await encodeFrames(out, gen, page);
        results.push({ name: scene.name, file: out, frames: scene.frames });
      }
    }));
  } finally {
    await browser.close();
  }
  return results.sort((a, b) => a.name.localeCompare(b.name, "en", { numeric: true })).map((r) => r.file);
}

// Stills or a short proof: [key, sceneIndex, fromSeconds, toSeconds] ranges with optional burned-in cues.
export async function renderRanges(ranges, out, cueFor) {
  const browser = await chromium.launch();
  mkdirSync(dirname(out), { recursive: true });
  const page = await openPage(browser, dirname(out));
  try {
    const all = { film: build("film"), x: build("x") };
    const frames = [];
    let cumulative = [];
    for (const [key, i, a, b] of ranges) {
      const scene = all[key][i];
      for (let n = Math.round(a * FPS); n < Math.round(b * FPS); n++) { cumulative.push([key, i, n]); frames.push(scene.frameAt(n)); }
    }
    let idx = 0;
    await encodeFrames(out, frames, page, () => { const c = cueFor?.(cumulative[idx]); idx++; return c ? `<div class="cap" style="font-size:42px">${c}</div>` : ""; });
  } finally {
    await browser.close();
  }
}

export async function stills(items, dir) {
  const browser = await chromium.launch();
  mkdirSync(dir, { recursive: true });
  const page = await openPage(browser, dir);
  try {
    const all = { film: build("film"), x: build("x") };
    for (const [key, i, t] of items) {
      const buf = await capture(page, all[key][i].frameAt(Math.round(t * FPS)));
      writeFileSync(join(dir, `${key}-s${i}-${t.toFixed(2)}.jpg`), buf);
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, dir, ...rest] = process.argv;
  if (cmd !== "stills") throw new Error("usage: render.mjs stills <dir> key:scene:t ...");
  await stills(rest.map((r) => { const [k, i, t] = r.split(":"); return [k, Number(i), Number(t)]; }), dir);
}
