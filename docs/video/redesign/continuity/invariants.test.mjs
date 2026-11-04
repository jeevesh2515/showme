import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { build, phoneFile, shotList } from "./film.mjs";

const here = new URL("../../out/voice/higgsfield/segments-fixed-point.json", import.meta.url);
const SEG = JSON.parse(readFileSync(here, "utf8")).segments;
const norm = (x) => x.toLowerCase().replace(/[^a-z0-9.]+/g, " ").replace(/\. /g, " ").trim().split(/\s+/).filter(Boolean);
function longestRun(a, b) {
  let best = [];
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    let n = 0;
    while (a[i + n] !== undefined && a[i + n] === b[j + n]) n++;
    if (n > best.length) best = a.slice(i, i + n);
  }
  return best;
}
const FRAMES = { film: 5400, x: 1338 };
const sumFrames = (k) => build(k).reduce((n, s) => n + s.frames, 0);

test("frame budgets are exact", () => { for (const k of ["film", "x"]) assert.equal(sumFrames(k), FRAMES[k]); });

test("excluded phone windows cannot render", () => {
  for (const t of [0, 6.19, 24.21, 25, 26.19, 29.61]) assert.throws(() => phoneFile(t), /outside the reviewed windows/);
  for (const t of [6.2, 24.2, 26.2, 29.6]) assert.ok(phoneFile(t));
});

test("every frame renders; every phone frame says self-demo; no em dash", () => {
  for (const k of ["film", "x"]) for (const scene of build(k)) for (let n = 0; n < scene.frames; n++) {
    const html = scene.frameAt(n);
    if (html.includes("/phone-a/") || html.includes("/phone-b/")) assert.match(html, /self-demo/, `${scene.name} frame ${n}`);
    assert.ok(!html.includes("—"), `${scene.name} frame ${n}`);
  }
});

test("each shot names a source and transition, and phone shots declare their source windows", () => {
  for (const k of ["film", "x"]) for (const s of shotList(k)) {
    assert.ok(s.source && s.transition && s.kind, s.id);
    if (s.source.includes("phone")) assert.ok(s.phone, s.id);
    for (const [a, b] of s.phone ?? []) assert.ok(a >= 6.2 && b <= 29.6 && !(a < 26.2 && b > 24.2), s.id);
  }
});

test("captions keep one safe band: no shot is under 0.6 s except marked rapid states", () => {
  for (const k of ["film", "x"]) for (const s of shotList(k)) assert.ok(s.end - s.start >= 0.6, `${s.id} ${s.end - s.start}`);
});

test("on-screen text never repeats the caption showing at that moment", () => {
  const found = new Set();
  for (const key of ["film", "x"]) build(key).forEach((scene, i) => {
    const seg = SEG[`${key}-${i}`];
    for (let n = 0; n < scene.frames; n += 3) {
      const t = n / 30, cue = seg.cues.find((c) => t >= seg.offset + c.start && t < seg.offset + c.end);
      if (!cue) continue;
      const shown = scene.frameAt(n).replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]+>/g, " ").replaceAll("&amp;", "&");
      const run = longestRun(norm(shown), norm(cue.text));
      if (run.length >= 3) found.add(`${key} ${scene.name} "${run.join(" ")}" from "${cue.text}"`);
    }
  });
  assert.deepEqual([...found], []);
});

test("the token mask stays in the share view", () => {
  const src = readFileSync(new URL("./film.mjs", import.meta.url), "utf8");
  assert.match(src, /srcT >= 33\.59 \? m\(1396, 968, 1908, 1032\) \+ m\(640, 1030, 748, 1086\)/);
});
