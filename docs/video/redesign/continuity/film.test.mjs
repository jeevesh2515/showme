import assert from "node:assert/strict";
import { test } from "node:test";
import { build, shotList } from "./film.mjs";

test("WEB-1 opening contains no orphan There label or premature phone cut", () => {
  for (const key of ["film", "x"]) {
    const scene = build(key)[0];
    for (let n = 0; n < Math.min(scene.frames, 294); n++) {
      const html = scene.frameAt(n);
      assert.doesNotMatch(html, />There\.</);
      assert.doesNotMatch(html, /phone-[ab]\//);
    }
    assert.equal(scene.shots.filter((s) => s.id === "opening-result").length, 1);
  }
});

test("WEB-1 privacy labels cannot contradict a completed mask", () => {
  assert.doesNotMatch(build("x")[1].frameAt(6.1 * 30), /Name still readable/);
  assert.doesNotMatch(build("film")[1].frameAt(15 * 30), /Still readable: 3 fields/);
});

test("ENG-4 engineering shows readable code context without editorial black bars", () => {
  const html = build("film")[4].frameAt(6 * 30);
  assert.match(html, /imagePayload/);
  assert.match(html, /RedactedImage/);
  assert.doesNotMatch(html, /Other lines redacted|all lines redacted/);
});

test("EVAL-7 grounding figures use the spoken units", () => {
  const scene = build("film")[2];
  const speed = scene.shots.find((s) => s.id === "speed");
  const html = speed.frame(speed.b - .1);
  assert.match(html, /2\.8 s/);
  assert.match(html, /&lt;1¢/);
  assert.doesNotMatch(html, /2,836 ms|\$0\.0061/);
});

test("WEB-1 both complete timelines retain their frame budgets and reviewed phone windows", () => {
  for (const [key, total] of [["film", 5400], ["x", 1338]]) {
    assert.equal(build(key).reduce((n, s) => n + s.frames, 0), total);
    for (const shot of shotList(key)) for (const [a, b] of shot.phone ?? []) assert.ok(a >= 6.2 && b <= 29.6 && !(a < 26.2 && b > 24.2));
  }
});
