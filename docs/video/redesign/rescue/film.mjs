// Story edit: stationary evidence within each shot; composition changes follow spoken ideas.
// Reuse the reviewed source projections, including their token mask. Never repaint product pixels.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build as lockedBuild, CSS as lockedCSS, FPS } from "../locked/film.mjs";

export { FPS };
export const CSS = lockedCSS;
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../../..");
const ev = JSON.parse(readFileSync(join(root, "docs/video/assets/evidence.json"), "utf8"));
const base = lockedBuild("x");
const ink = "#16264a", paper = "#ffffff", mist = "#e9eef6", yellow = "#ffd43b";
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { const u = clamp(x); return 1 - (1 - u) ** 3; };
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const block = (x, y, w, h, html, style = "") => `<div data-fit style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;${style}">${html}</div>`;
const type = (x, y, w, h, size, html, style = "") => block(x, y, w, h, html, `font-size:${size}px;font-weight:800;line-height:1.04;${style}`);
const line = (x, y, w, t) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:12px;background:${yellow};transform-origin:left;transform:scaleX(${ease(t / .45).toFixed(4)})"></div>`;
const src = (i, id, t) => base[i].shots.find((s) => s.id === id).fn("stage", t);
const projected = (html, x, y, w, h, ox = 0, oy = 0, scale = w / 1280) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;background:${paper}"><div style="position:absolute;left:${-ox * scale}px;top:${-oy * scale}px;width:1280px;height:740px;transform-origin:0 0;transform:scale(${scale})">${html}</div></div>`;
const full = (html, x = 720, y = 140, w = 1120) => projected(html, x, y, w, w * 740 / 1280);
const frame = (body, label, dark = false) => `<div style="position:absolute;inset:0;background:${dark ? ink : paper};color:${dark ? paper : ink}">${body}${type(72, 34, 1776, 46, 32, "ShowMe", "font-weight:700")}${block(72, 1010, 1776, 62, esc(label), `font-size:27px;line-height:30px;font-weight:500;color:${dark ? mist : ink}`)}</div>`;
const head = (a, b, t, dark = false) => type(72, 178, 600, 350, 96, a) + line(76, 558, 410, t) + type(76, 602, 560, 160, 42, b, `font-weight:500;line-height:1.2;color:${dark ? mist : ink}`);
const still = "Synthetic billing example. Recorded result held; no subscription changed. AI-generated narration.";
const take = "Third main recording, selected after earlier attempts. Earlier low-box result; waits shortened.";

const shots = [
  [
    { id: "question", a: 0, b: 3.89, source: "billing.png", disclosure: "Synthetic billing original; static detail crop", frame: (t) => frame(head("Where do<br>I press?", "A screenshot.<br>One clear question.", t) + full(src(0, "question", t), 760, 145, 1088), "Illustrative question on a synthetic billing screen. AI-generated narration.") },
    { id: "answer", a: 3.89, b: 7.4, source: "main frame 472", disclosure: "Actual product result, held; static detail crop", frame: (t) => frame(type(72, 156, 650, 350, 142, "ShowMe.<br>There.") + line(78, 515, 455, t - 3.89) + type(78, 575, 570, 170, 46, "One highlighted<br>next step.", "font-weight:500;line-height:1.16") + projected(src(0, "there", t), 770, 170, 1060, 590, 205, 455, 2.25), still, true) },
  ],
  [
    { id: "local-mask", a: 0, b: 3.42, source: "main 5.2", disclosure: "Actual browser review, held", frame: (t) => frame(head("Privacy<br>comes first.", "Some details are masked<br>in your browser.", t) + full(src(1, "masks", t)), "Actual browser review on the synthetic example. Detection is partial. AI-generated narration.") },
    { id: "brush", a: 3.42, b: 6.96, source: "main 7.68-11.22", disclosure: "Actual brush action; selected excerpt at source speed", frame: (t) => frame(head("It missed<br>the name.", "You check it.<br>You hide it.", t - 3.42) + projected(src(1, "by-hand", t), 740, 140, 1100, 650, 80, 190, 1.05), "Recorded brush action at source speed. Synthetic details. AI-generated narration.") },
    { id: "upload", a: 6.96, b: 8.4, source: "raw/uploaded.jpg", disclosure: "Actual captured uploaded pixels", frame: (t) => frame(head("Only then:<br>upload.", "This is the exact<br>redacted image sent.", t - 6.96) + full(src(1, "upload", t)), "Captured upload from POST /v1/step. Synthetic billing screen. AI-generated narration.") },
  ],
  [
    { id: "goal", a: 0, b: 3.433333, source: "raw/uploaded.jpg", disclosure: "Actual upload; editorial goal label", frame: (t) => frame(head("Find one<br>next control.", "Muse Spark 1.3\u2009\nGoal: cancel my subscription", t) + full(src(2, "spark", t)), "Actual redacted upload. Meta Muse Spark 1.3. AI-generated narration.") },
    { id: "box", a: 3.433333, b: 5.033333, source: "main frame 471", disclosure: "Actual Spark box, held; static detail crop", frame: (t) => frame(head("Spark<br>finds it.", "One action.<br>One location.", t - 3.433333, true) + projected(src(2, "box", t), 770, 170, 1060, 590, 205, 455, 2.25), "Recorded Spark box, held. Synthetic example. AI-generated narration.", true) },
    { id: "outline", a: 5.033333, b: 8.0333, source: "main frame 472; main-refine-response.json", disclosure: "Actual SAM outline, held; gate value from this take", frame: (t) => frame(head("SAM outlines.<br>If it agrees.", "Box overlap: 0.89<br>Gate requires 0.5 or higher.", t - 5.033333, true) + projected(src(2, "outline", t), 770, 170, 1060, 590, 205, 455, 2.25), `Recorded outline, held. SAM never moves the click point. ${take} AI narration.`, true) },
  ],
  [
    { id: "share", a: 0, b: 2.233333, source: "main 34.2-35.7", disclosure: "Recorded share UI; link token masked; held after source end", frame: (t) => frame(head("Send back<br>one step.", "A link that expires<br>after seven days.", t) + full(src(3, "link", t)), "Recorded share screen. Link token hidden; end frame held. AI-generated narration.") },
    { id: "phone", a: 2.233333, b: 5.6, source: "phone 11.3-14.666667 and detail 17.4 held", disclosure: "iPhone 16 self-demo; navigation cut; separate-time held detail", frame: (t) => {
      const sourceT = 11.3 + t - 2.233333;
      const n = Math.round((sourceT - 6.2) * FPS) + 1;
      const phoneFile = join(root, `docs/video/out/fixed-point-cache/phone-a/${String(n).padStart(5, "0")}.jpg`);
      const detailFile = join(root, "docs/video/out/fixed-point-cache/phone-a/00337.jpg");
      const imageCrop = (file, x, y, w, h, ox, oy, scale) => block(x, y, w, h, `<img src="${pathToFileURL(file).href}" style="position:absolute;left:${-ox * scale}px;top:${-oy * scale}px;width:${1180 * scale}px;height:${2556 * scale}px">`).replace("data-fit ", "");
      return frame(imageCrop(phoneFile, 100, 110, 352, 770, 0, 0, 352 / 1180) + type(610, 120, 1180, 270, 108, "One instruction.<br>One highlight.") + line(615, 365, 710, t - 2.233333) + imageCrop(detailFile, 610, 420, 1110, 350, 100, 1490, 1.05) + type(615, 804, 1170, 65, 33, "Held detail from 17.4s; a different moment in the same recording.", "font-weight:500"), "iPhone 16 self-demo. Navigation cut. A picture, not remote control; nothing cancelled. AI narration.");
    } },
  ],
  [
    { id: "absent", a: 0, b: 2.366667, source: "raw/absent-final.png", disclosure: "Actual separate recorded absent-target call", frame: (t) => frame(head("What if it<br>isn't there?", "The product can say<br>“not visible”.", t) + full(src(4, "absent", t)), "Separate recorded call on the synthetic example. AI-generated narration.") },
    { id: "absent-score", a: 2.366667, b: 6.666667, source: "eval/results via evidence.json", disclosure: "Recorded absent-target result and failures, separate from injection probes", frame: (t) => frame(type(80, 130, 1740, 100, 64, "When the target was absent") + type(72, 248, 990, 300, 190, `${ev.expectedNotVisible.absentHits} / ${ev.expectedNotVisible.absentPairs}`) + type(86, 565, 970, 160, 62, "said “not visible”.", "font-weight:500") + block(1120, 260, 680, 480, type(0, 0, 650, 180, 150, "44 / 49") + type(0, 200, 650, 245, 57, "of the other probes<br>still got a highlight.", "font-weight:500;line-height:1.2"), `border-left:6px solid ${yellow};padding-left:35px`) + line(88, 500, 810, t - 2.366667), "Prompt v3, SAM off. 200 absent-target probes; injection tests separate. AI-generated narration.") },
    { id: "grounding-score", a: 6.666667, b: 11.8333, source: "eval/results via evidence.json", disclosure: "Held-out annotated examples, not unique screenshots; failures public", frame: (t) => frame(type(80, 130, 1750, 100, 64, "Click point inside the labelled target") + type(72, 245, 1070, 300, 190, `${ev.grounding.percent}%`) + line(88, 500, 900, t - 6.666667) + type(88, 565, 1060, 160, 61, "1,054 / 1,172<br>held-out examples", "font-weight:500;line-height:1.14") + type(1200, 285, 600, 300, 86, "The failures<br>are public.") + type(1204, 642, 590, 160, 38, "eval/results<br>in the repository", "font-weight:500;line-height:1.2"), "Prompt v3; SAM off. 696 unique images; one image pair overlaps dev/reporting. AI-generated narration.") },
  ],
  [
    { id: "close", a: 0, b: 3.3334, source: "editorial typography", disclosure: "AI-generated narration", frame: (t) => frame(type(100, 120, 1740, 300, 230, "ShowMe") + line(112, 390, 760, t) + type(112, 455, 1680, 110, 70, "One clear next step.", "font-weight:500") + type(112, 652, 1680, 80, 61, "showme-web-delta.vercel.app", "font-weight:600") + type(112, 755, 1680, 80, 52, "github.com/jeevesh2515/showme", "font-weight:500"), "Built solo for the Meta Global AI Developer Hackathon. AI-generated narration.", true) },
  ],
];

export function build(key) {
  if (key === "film") return lockedBuild(key); // Needed only by the shared stills helper; story film exports are blocked by build.mjs.
  if (key !== "x") throw new Error(`Unknown composition ${key}`);
  return base.map((scene, i) => ({ ...scene, shots: shots[i], frameAt(n) {
    const t = n / FPS;
    const shot = shots[i].find((s) => t < s.b) ?? shots[i].at(-1);
    return shot.frame(t);
  } }));
}
export const shotList = (key) => build(key).flatMap((scene) => scene.shots.map(({ id, a, b, source, disclosure }) => ({ scene: scene.name, id, start: a, end: b, source, disclosure })));
