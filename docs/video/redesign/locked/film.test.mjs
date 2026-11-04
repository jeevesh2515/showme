// Run: FILM_EDIT=locked node --test docs/video/redesign/locked/film.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { build, FPS } from "./film.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const edit = JSON.parse(readFileSync(join(here, "../../film/phone-edit.json"), "utf8"));
const excluded = (t) => edit.excluded.some((w) => t >= w.start && t < w.end);

for (const [key, total] of [["film", 5400], ["x", 1338]]) {
  test(`${key}: frame budget and phone provenance on every frame`, () => {
    const scenes = build(key);
    assert.equal(scenes.reduce((n, s) => n + s.frames, 0), total);
    for (const scene of scenes) for (let n = 0; n < scene.frames; n++) {
      const html = scene.frameAt(n);
      for (const m of html.matchAll(/phone-([ab])\/(\d+)\.jpg/g)) {
        const t = (m[1] === "a" ? 6.2 : 26.2) + (Number(m[2]) - 1) / FPS;
        assert.ok(!excluded(t), `${scene.name} frame ${n} uses excluded source ${t}`);
        assert.match(html, /self-demo/, `${scene.name} frame ${n} lacks a self-demo label`);
      }
      assert.ok(!html.includes("—"), `${scene.name} frame ${n} has an em dash`);
    }
  });

  test(`${key}: shots hold for at least 1.4 s, so nothing flashes past`, () => {
    for (const scene of build(key)) for (const s of scene.shots) assert.ok(s.b - s.a >= 1.4 || s.id === "never-moves", `${scene.name} ${s.id} lasts ${s.b - s.a}`);
  });
}
