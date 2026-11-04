import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { build, FPS, shotList } from "./film.mjs";

test("WEB-1: complete X timeline retains 1338 frames with no uncovered shot boundaries", () => {
  const scenes = build("x");
  assert.equal(scenes.reduce((n, s) => n + s.frames, 0), 1338);
  for (const scene of scenes) {
    assert.equal(scene.shots[0].a, 0);
    for (let i = 1; i < scene.shots.length; i++) assert.equal(scene.shots[i - 1].b, scene.shots[i].a);
    assert.ok(Math.abs(scene.shots.at(-1).b - scene.dur) < 0.001);
  }
});

test("WEB-1: every rendered phone frame is inside the approved source windows and labelled self-demo", () => {
  const edit = JSON.parse(readFileSync(new URL("../../film/phone-edit.json", import.meta.url)));
  let count = 0;
  for (const scene of build("x")) for (let n = 0; n < scene.frames; n++) {
    const html = scene.frameAt(n);
    for (const m of html.matchAll(/phone-a\/(\d+)\.jpg/g)) {
      const t = 6.2 + (Number(m[1]) - 1) / FPS;
      assert.ok(!edit.excluded.some((w) => t >= w.start && t < w.end), `${scene.name} ${n}: excluded ${t}`);
      assert.match(html, /iPhone 16 self-demo/);
      assert.match(html, /Held detail from 17.4s/);
      count++;
    }
  }
  assert.ok(count > 100);
});

test("EVAL-7: absent failures and denominator remain visible, evidence uses annotated examples", () => {
  assert.match(build("x")[4].frameAt(4 * FPS), /44 \/ 49/);
  assert.match(build("x")[4].frameAt(4 * FPS), /151 \/ 200/);
  assert.match(build("x")[4].frameAt(9 * FPS), /1,054 \/ 1,172/);
  assert.match(build("x")[4].frameAt(9 * FPS), /696 unique images/);
});

test("PRIV-5: share shot retains the reviewed opaque token mask and declared hold", () => {
  const html = build("x")[3].frameAt(FPS);
  assert.match(html, /background:#000/);
  assert.match(shotList("x").find((s) => s.id === "share").disclosure, /token masked/);
});
