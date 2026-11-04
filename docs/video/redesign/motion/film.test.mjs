// Run: node --test docs/video/redesign/motion/film.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build, FPS, shotList } from "./film.mjs";

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, "../../../..");
const edit = JSON.parse(readFileSync(join(root, "docs/video/film/phone-edit.json"), "utf8"));
const excluded = (t) => edit.excluded.some((w) => t >= w.start && t < w.end);

for (const [key, total] of [["film", 5400], ["x", 1338]]) {
  test(`${key}: frame budget matches the required duration`, () => {
    assert.equal(build(key).reduce((n, s) => n + s.frames, 0), total);
  });

  test(`${key}: every phone frame comes from a reviewed window, never keyboard or app switcher`, () => {
    let phoneFrames = 0;
    for (const scene of build(key)) for (let n = 0; n < scene.frames; n++) {
      for (const m of scene.frameAt(n).matchAll(/phone-([ab])\/(\d+)\.jpg/g)) {
        const t = (m[1] === "a" ? 6.2 : 26.2) + (Number(m[2]) - 1) / FPS;
        assert.ok(!excluded(t), `${key} ${scene.name} frame ${n} uses excluded source ${t}`);
        phoneFrames++;
      }
    }
    assert.ok(phoneFrames > 100);
  });

  test(`${key}: phone shots carry a self-demo disclosure, film labels have no em dash`, () => {
    for (const shot of shotList(key)) if (/^phone/.test(shot.source)) assert.match(`${shot.disclosure} ${shot.kind}`, /self-demo|Navigation cut|Stabilised|Frame held|Product's own/i, shot.id);
    for (const scene of build(key)) for (let n = 0; n < scene.frames; n += 15) assert.ok(!/—/.test(scene.frameAt(n)), `${scene.name} ${n}`);
  });

  test(`${key}: phone frames name the self-demo in the band`, () => {
    for (const scene of build(key)) for (let n = 0; n < scene.frames; n++) {
      const html = scene.frameAt(n);
      if (/phone-[ab]\//.test(html)) assert.match(html, /self-demo/, `${scene.name} frame ${n}`);
    }
  });
}
