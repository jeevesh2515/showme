import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "./film.mjs";

test("WEB-1 figures and reply words remain unobscured before their spoken emphasis", () => {
  for (const [key, scene, id] of [["film", 0, "study"], ["film", 2, "reply"], ["film", 2, "speed"], ["film", 5, "grounding"], ["x", 4, "absent-figure"], ["x", 4, "public"]]) {
    const shot = build(key)[scene].shots.find((s) => s.id === id);
    assert.ok(shot);
    const html = shot.frame(shot.a);
    assert.doesNotMatch(html, /transform-origin:right;transform:scaleX/);
    assert.match(html, /data-editorial-emphasis/);
  }
});

test("WEB-1 editorial tabs are readable immediately rather than clipped to narration", () => {
  const scene = build("film")[2], shot = scene.shots.find((s) => s.id === "spark");
  assert.doesNotMatch(shot.frame(shot.a), /clip-path/);
  assert.match(shot.frame(shot.a), /Goal: Cancel my subscription/);
});
