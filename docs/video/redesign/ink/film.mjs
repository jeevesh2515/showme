// "Black hides. Yellow shows." Footage fills the frame, editorial marks stay flat bars and tabs, nothing traces the recorded ring.
// Every frame is a pure function of time. Figures are recounted from eval/results when this module loads.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../../..");
const OUT = join(root, "docs/video/out"), RAW = join(OUT, "raw"), CACHE = join(OUT, "fixed-point-cache");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const url = (p) => pathToFileURL(p).href;
const tracks = json(join(CACHE, "tracks.json")), tl = json(join(RAW, "main/timeline.json"));
const words = json(join(here, "../motion/words.json")), timing = json(join(here, "../timing.json"));
const step = json(join(RAW, "main-step-response.json")), sam = json(join(RAW, "main-refine-response.json"));
const ev = json(join(root, "docs/video/assets/evidence.json"));
const absent = json(join(RAW, "absent-step-response.json"));

export const FPS = 30;
const INK = "#16264a", SUN = "#ffd43b", MIST = "#e9eef6", MUTED = "#42506e", PAPER = "#ffffff";
const STAGE = { film: 964, x: 948 };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (u) => { const v = clamp(u); return 1 - (1 - v) ** 3; };
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const W = (id, text, nth = 0) => {
  const seg = words[id], hits = seg.words.filter((w) => w.text.replace(/^[^\w]+|[^\w]+$/g, "") === text);
  if (!hits[nth]) throw new Error(`${id}: no word ${text}`);
  return seg.offset + hits[nth].start;
};

// Evidence: recount generated artifacts and refuse to render on any disagreement with evidence.json.
const rows = (src) => readFileSync(join(root, ev.sources[src], "predictions.jsonl"), "utf8").trim().split("\n").map((l) => JSON.parse(l));
const yes = (v) => v === true || v === "True";
const groundCells = rows("grounding").map((r) => (yes(r.hit) ? "y" : "k"));
const proCells = rows("pro").map((r) => (yes(r.hit) ? "y" : "k"));
const absentRows = rows("negatives").filter((r) => r.sample_id.startsWith("neg-"));
const lit = (r) => r.point !== null && r.point !== "None";
const absentCells = absentRows.map((r) => (r.status === "not_visible" ? "y" : lit(r) ? "k" : "o"));
const e2eCells = json(join(root, ev.sources.e2e, "results.json")).tasks.map((r) => (r.success ? "y" : "k"));
const count = (cells, c) => cells.filter((x) => x === c).length;
const groundSummary = json(join(root, ev.sources.grounding, "summary.json"));
const N = ev.expectedNotVisible;
const check = (name, got, want) => { if (got !== want) throw new Error(`Evidence mismatch ${name}: ${got} against ${want}`); };
check("grounding hits", count(groundCells, "y"), ev.grounding.hits); check("grounding n", groundCells.length, ev.grounding.n);
check("pro hits", count(proCells, "y"), ev.pro.hits); check("pro n", proCells.length, ev.pro.n);
check("absent hits", count(absentCells, "y"), N.absentHits); check("absent n", absentCells.length, N.absentPairs); check("absent highlighted", count(absentCells, "k"), N.absentMissesHighlighted);
check("e2e passed", count(e2eCells, "y"), ev.e2e.passed); check("e2e n", e2eCells.length, ev.e2e.n);
if (Math.abs(groundSummary.latency_p50_ms / 1000 - 2.8) >= 0.05) throw new Error("Spoken 2.8 s no longer matches the summary");
if (groundSummary.total_cost_usd / groundSummary.n >= 0.01) throw new Error("Spoken under a cent no longer matches the summary");
const iou = (() => { const b = step.target.box, s = sam.box, i = Math.max(0, Math.min(b.x2, s.x2) - Math.max(b.x1, s.x1)) * Math.max(0, Math.min(b.y2, s.y2) - Math.max(b.y1, s.y1)), A = (r) => (r.x2 - r.x1) * (r.y2 - r.y1); return { v: i / (A(b) + A(s) - i), area: (A(s) / (1280 * 740)) * 100 }; })();

// Footage placement. One registration for every screenshot state: the 1280 by 740 picture at 1.5x, top 60 hidden.
const placed = (file, w, h, ox, oy, s) => `<img src="${url(file)}" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;transform:translate(${(-ox * s).toFixed(3)}px,${(-oy * s).toFixed(3)}px) scale(${s.toFixed(5)})">`;
const Y0 = 60, S15 = 1.5;
const stillPic = (file) => placed(file, 1280, 740, 0, Y0, S15);
const ORIGINAL_FILE = join(root, "apps/web/public/examples/billing.png"), UPLOAD_FILE = join(RAW, "uploaded.jpg");
const ORIGINAL = stillPic(ORIGINAL_FILE), UPLOADED = stillPic(UPLOAD_FILE);
const t0 = tl.frames[0].t;
const mainIndex = (t) => { let lo = 0, hi = tl.frames.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tl.frames[m].t - t0 <= t) lo = m; else hi = m - 1; } return lo; };
const mainFile = (t) => join(RAW, `main/f${String(tl.frames[mainIndex(t)].n).padStart(6, "0")}.jpg`);
const REVIEW_K = 1.16, STEP_K = 0.881;
// The review picture is pinned by its measured button, so the toolbar wrapping never shows. A frame with no button holds the last clean one.
function review(t) {
  if (t > 16.2) throw new Error(`Review source ${t}s scrolls the picture away`);
  let i = mainIndex(t);
  while (i > 0 && !tracks.main[tl.frames[i].n].blue) i--;
  const f = tl.frames[i], b = tracks.main[f.n].blue;
  return placed(join(RAW, `main/f${String(f.n).padStart(6, "0")}.jpg`), 2560, 1440, b[0] - 190 * REVIEW_K, b[1] - (614 - Y0) * REVIEW_K, S15 / REVIEW_K);
}
const stepPic = (t) => placed(mainFile(t), 2560, 1440, 304, 226 + Y0 * STEP_K, S15 / STEP_K);
const BOX = 21, OUTLINE = 23;
const whole = (file) => placed(file, 2560, 1440, 0, 0, 0.75); // the product window, native proportions
const product = (t) => whole(mainFile(t));
const ABSENT_FILE = join(RAW, "absent-final.png");
// The upload as an object: all of it, on ink.
const contained = (file, H) => { const top = 112, s = (H - top) / 740, w = 1280 * s; return `<div style="position:absolute;inset:0;background:${INK}"><div style="position:absolute;left:${(1920 - w) / 2}px;top:${top}px;width:${w}px;height:${H - top}px;overflow:hidden">${placed(file, 1280, 740, 0, 0, s)}</div></div>`; };
// Share screen at native pixels, with the live token hidden once the link exists.
function shareView(srcT, oy) {
  const ox = 320, m = (a, b, c, d) => `<div style="position:absolute;left:${a - ox}px;top:${b - oy}px;width:${c - a}px;height:${d - b}px;background:#000"></div>`;
  return `<div style="position:absolute;inset:0;background:#fff">${placed(mainFile(srcT), 2560, 1440, ox, oy, 1)}${srcT >= 33.59 ? m(1396, 968, 1908, 1032) + m(640, 1030, 748, 1086) : ""}</div>`;
}

// Phone frames from the reviewed cache. Excluded source windows cannot render.
export function phoneFile(t) {
  if (t < 6.2 || (t > 24.2 && t < 26.2) || t > 29.6) throw new Error(`Phone source ${t}s is outside the reviewed windows`);
  if (t <= 24.2) return join(CACHE, `phone-a/${String(clamp(Math.round((t - 6.2) * FPS), 0, 539) + 1).padStart(5, "0")}.jpg`);
  return join(CACHE, `phone-b/${String(clamp(Math.round((t - 26.2) * FPS), 0, 103) + 1).padStart(5, "0")}.jpg`);
}
const PHONE_TOP = 150; // below the status bar
const phoneCard = (x, y, w, h, t) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:28px;overflow:hidden;background:#fff">${placed(phoneFile(t), 1180, 2556, 0, PHONE_TOP, w / 1180)}</div>`;
const phoneCrop = (x, y, w, h, t, ox, oy, s, round = 16) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:${round}px;overflow:hidden;background:#fff">${placed(phoneFile(t), 1180, 2556, ox, oy, s)}</div>`;
// The recorded pinch, whole width at native pixels.
const hero = (t, H, oy = 880) => `<div style="position:absolute;inset:0;background:${INK}"></div>${phoneCrop(370, 0, 1180, H, t, 0, oy, 1, 0)}`;

// Editorial marks. All sit above the footage as flat shapes.
const tab = (o) => { const { x, y, right, size = 64, text, bg = INK, color = PAPER, t = 99, at = 0, pad = 0.34 } = o; const p = ease((t - at) / 0.22); return `<div data-inframe style="position:absolute;${right !== undefined ? `right:${right}px` : `left:${x}px`};top:${y}px;background:${bg};color:${color};font-size:${size}px;line-height:1.16;font-weight:800;padding:${size * 0.16}px ${size * pad}px;white-space:nowrap;clip-path:inset(0 ${(100 - p * 100).toFixed(2)}% 0 0)">${esc(text)}</div>`; };
const lift = (inner, t, at, bg = INK) => { const p = ease((t - at) / 0.3); return `<span style="position:relative;display:inline-block">${inner}${p < 1 ? `<span style="position:absolute;left:-.08em;right:-.08em;top:.08em;bottom:.08em;background:${bg};transform-origin:right;transform:scaleX(${(1 - p).toFixed(4)})"></span>` : ""}</span>`; };
const block = (x, y, w, h, html, style = "") => `<div data-fit style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;overflow:hidden;${style}">${html}</div>`;
const text = (x, y, w, h, size, html, weight = 800, color = "inherit", lh = 1.1) => block(x, y, w, h, html, `font-size:${size}px;font-weight:${weight};line-height:${lh};color:${color}`);
const ground = (bg, color = INK) => `<div style="position:absolute;inset:0;background:${bg};color:${color}"></div>`;
const onGround = (bg, color, html) => `<div style="position:absolute;inset:0;background:${bg};color:${color}">${html}</div>`;
// One tick beside a field the automatic detection missed; the recording then blacks that field.
const tick = (y1, y2, t, at, until) => (t < at || t >= until ? "" : `<div style="position:absolute;left:252px;top:${(y1 - Y0) * S15}px;width:20px;height:${(y2 - y1) * S15 * clamp((t - at) / 0.16)}px;background:${SUN};outline:2px solid ${INK}"></div>`);
// Fields the browser masked, revealed from the real review frame. Rectangles measured in the 1280 picture.
const MASKS = { card: [[198, 322, 342, 346]], phone: [[198, 477, 332, 504], [358, 663, 465, 689]], postcode: [[385, 558, 472, 581]], email: [[513, 663, 692, 689]] };
const maskLayer = (rects, t, at, srcT = 5.2) => rects.map(([a, b, c, d]) => { const p = ease((t - at) / 0.18); return p <= 0 ? "" : `<div style="position:absolute;left:${a * S15}px;top:${(b - Y0) * S15}px;width:${(c - a) * S15 * p}px;height:${(d - b) * S15}px;overflow:hidden"><div style="position:absolute;left:${-a * S15}px;top:${-(b - Y0) * S15}px;width:1920px;height:1110px">${review(srcT)}</div></div>`; }).join("");

// One square per example, in file order. Yellow worked, black did not, hollow is neither.
function grid(cells, x, y, cols, size, gap, t, at) {
  const sweep = clamp((t - at) / 0.7), shown = Math.ceil(sweep * cells.length), rects = cells.map((c, i) => {
    const cx = (i % cols) * (size + gap), cy = Math.floor(i / cols) * (size + gap), on = i < shown;
    return `<rect x="${cx}" y="${cy}" width="${size}" height="${size}" fill="${!on ? MIST : c === "y" ? SUN : c === "k" ? INK : c === "m" ? "#3a4c74" : PAPER}"${on && c === "o" ? ` stroke="${INK}" stroke-width="2"` : ""}/>`;
  }).join("");
  const h = Math.ceil(cells.length / cols) * (size + gap);
  return `<svg style="position:absolute;left:${x}px;top:${y}px" width="${cols * (size + gap)}" height="${h}">${rects}</svg>`;
}
const percentGrid = (x, y, t, at) => grid(Array.from({ length: 100 }, (_, i) => (i < 65 ? "y" : "m")), x, y, 10, 42, 6, t, at);
function figureFrame({ label, number, lines, cells, cols, size, gap, t, at, gridX = 900, gridY = 150, numberSize = 220, numberH = 280 }) {
  return onGround(PAPER, INK, text(80, 90, 780, 170, 56, esc(label)) + text(80, 270, 800, numberH, numberSize, lift(esc(number), t, at), 800, INK, 1.15) + lines.map(([s, when], i) => text(80, 270 + numberH + 20 + i * 112, 800, 104, 42, lift(esc(s), t, when), 600, MUTED, 1.2)).join("") + grid(cells, gridX, gridY, cols, size, gap, t, at));
}

// Real source lines, redacted except the line being spoken about.
const fileLines = (rel) => readFileSync(join(root, rel), "utf8").split("\n");
const CH = 25.3; // Menlo advance at 42 px
function doc(rel, from, to, litLine, token, t, at, y = 110, lh = 84) {
  const L = fileLines(rel), body = [];
  for (let n = from; n <= to; n++) {
    const s = L[n - 1] ?? "", indent = s.length - s.trimStart().length, top = y + 62 + (n - from) * lh;
    if (!s.trim()) continue;
    if (n === litLine) {
      if (!s.includes(token)) throw new Error(`${rel}:${n} no longer contains ${token}`);
      const [pre, post] = s.trim().split(token);
      const inner = `${esc(pre)}<span style="background:linear-gradient(${SUN},${SUN}) no-repeat 0 60%/${(clamp((t - at - 0.3) / 0.3) * 100).toFixed(1)}% 90%">${esc(token)}</span>${esc(post ?? "")}`;
      body.push(`<div class="mono" data-fit style="position:absolute;left:${80 + indent * CH}px;top:${top - 14}px;width:${1780 - indent * CH}px;height:66px;font-size:42px;line-height:60px;font-weight:700;white-space:nowrap;overflow:hidden">${lift(inner, t, at)}</div>`);
    } else body.push(`<div style="position:absolute;left:${80 + indent * CH}px;top:${top}px;width:${Math.min(s.trim().length, 66) * CH}px;height:30px;background:${INK}"></div>`);
  }
  return `<div style="position:absolute;left:80px;top:${y}px;font-size:32px;font-weight:600;color:${MUTED}">${esc(rel)}</div>${body.join("")}`;
}
// The real reply, field lines lifted as they are named.
function reply(t, marks) {
  const v = [["{", null], [`  "status": "${step.status}",`, null], [`  "action": "${step.action}",`, marks.action], [`  "instruction": "${step.instruction}",`, marks.sentence], [`  "target": {`, null], [`    "label": "${step.target.label}",`, marks.label], [`    "point": { "x": ${step.target.point.x}, "y": ${step.target.point.y} },`, marks.point], [`  }`, null], [`}`, null]];
  return v.map(([s, at], i) => {
    const top = 120 + i * 82, indent = s.length - s.trimStart().length, plain = s.trim();
    if (at === null) return `<div class="mono" style="position:absolute;left:${90 + indent * CH}px;top:${top}px;font-size:42px;line-height:60px;font-weight:600;color:${MUTED}">${esc(plain)}</div>`;
    return `<div class="mono" data-fit style="position:absolute;left:${90 + indent * CH}px;top:${top}px;width:${1800 - indent * CH}px;height:62px;font-size:42px;line-height:60px;font-weight:700;white-space:nowrap;overflow:hidden">${lift(esc(plain), t, at)}</div>`;
  }).join("");
}
// Coordinates from this take, drawn large. A diagram of the rule, not the product's overlay.
function gateDiagram(t, marks) {
  const k = 4.4, ox = 340, oy = 60, X = (v) => 80 + (v - ox) * k, Y = (v) => 240 + (v - 590) * k, b = step.target.box, s = sam.box, p = step.target.point;
  const r = (q, st) => `<div style="position:absolute;left:${X(q.x1)}px;top:${Y(q.y1)}px;width:${(q.x2 - q.x1) * k}px;height:${(q.y2 - q.y1) * k}px;${st}"></div>`;
  const row = (y, label, value, at) => text(1220, y, 660, 56, 36, esc(label), 600, MUTED, 1.2) + text(1220, y + 56, 660, 116, 96, lift(esc(value), t, at), 800, INK, 1.1);
  return onGround(PAPER, INK, text(80, 70, 1060, 64, 44, "This take's coordinates, drawn large") + r(s, `background:${SUN}`) + r(b, `outline:6px solid ${INK}`) + `<div style="position:absolute;left:${X(p.x) - 11}px;top:${Y(p.y) - 11}px;width:22px;height:22px;background:${INK}"></div>` + text(X(b.x1), Y(b.y2) + 24, 1040, 50, 32, "Outline: Spark's box. Yellow: SAM's box. Square: Spark's point.", 600, MUTED, 1.2) + row(100, "Box overlap, needs at least 0.5", iou.v.toFixed(2), marks[0]) + row(340, "SAM's box contains Spark's point", `${p.x}, ${p.y}`, marks[1]) + row(580, "Area of the image, limit 25%", `${iou.area.toFixed(1)}%`, marks[2]));
}
// Crosshair arms stop short of the point, so the recorded ring is never touched.
const crosshair = (px, py, H) => { const fx = px * S15, fy = (py - Y0) * S15, gap = 92, c = `background:${INK};box-shadow:0 0 0 1.5px #fff;position:absolute`; return `<div style="${c};left:${fx - 1.5}px;top:0;width:3px;height:${Math.max(0, fy - gap)}px"></div><div style="${c};left:${fx + gap + 90}px;top:${fy - 1.5}px;width:${1920 - fx - gap - 90}px;height:3px"></div>` + (H ? "" : ""); };

const SYN = "Synthetic billing screen, made up for this film.";
const TAKE_TAG = "Third main recording, selected after earlier attempts. Waits shortened.";
const SELF = "iPhone 16 self-demo.";

const shot = (id, a, b, meta, frame) => ({ id, a, b, ...meta, frame });

function filmScenes() {
  const H = STAGE.film;
  const stat = W("film-0", "65"), who = W("film-0", "ShowMe"), cutThere = 3.8, cutWhole = 5.62, cutPhone = 9.8;
  const phoneS0 = (t) => 14 + (t - cutPhone);
  const s0 = [
    shot("question", 0, cutThere, { kind: "still source image", source: "billing.png", tag: ["r", `${SYN} AI-generated narration.`], take: "A form and one plain question", trans: "Hard cut: everything dims except the button" }, () => ORIGINAL + tab({ right: 80, y: 90, text: "Their goal: cancel this", size: 66 })),
    shot("there", cutThere, cutWhole, { kind: "real product result, frame held", source: "main frame 472", tag: ["r", "Real result on the synthetic screen, frame held. Private details masked first."], take: "The answer on the same spot", trans: "Hard cut to the whole product" }, (t) => stepPic(OUTLINE) + tab({ right: 80, y: 90, text: "There.", size: 76, bg: SUN, color: INK, t, at: cutThere + 0.1 })),
    shot("whole", cutWhole, cutPhone, { kind: "real product result, frame held", source: "main frame 472", tag: ["l", TAKE_TAG], take: "One highlight, one instruction, the real screen", trans: "Hard cut to phone" }, () => product(OUTLINE)),
    shot("pinch-stat", cutPhone, who, { kind: "real phone at source speed, beside a sourced figure", source: "phone 14.0-19.0", phone: [[14, 19.02]], tag: ["l", `${SELF} Not a study participant. One square per percent.`], take: "A thumb finds the highlight; why this matters", trans: "Right side changes" }, (t) => onGround(INK, PAPER, phoneCard(150, 32, 420, 900, phoneS0(t)) + text(700, 250, 640, 340, 240, lift("65%", t, stat, SUN), 800, PAPER, 1.1) + text(704, 560, 640, 110, 34, "Journal of Applied Gerontology", 500, MIST, 1.3) + percentGrid(1320, 240, t, stat))),
    shot("for-helper", who, 18.3, { kind: "real phone beside wordmark", source: "phone 19.0-22.5", phone: [[19, 22.5]], tag: ["l", SELF], take: "Who it is for", trans: "Bars close over the frame" }, (t) => onGround(INK, PAPER, phoneCard(150, 32, 420, 900, phoneS0(t)) + text(720, 300, 1140, 230, 180, "ShowMe", 800, PAPER, 1.1) + `<div style="position:absolute;left:724px;top:530px;width:${620 * ease((t - who - 0.1) / 0.3)}px;height:14px;background:${SUN}"></div>` + text(724, 575, 1120, 80, 54, "One screenshot in. One next step out.", 600, PAPER, 1.2))),
  ];

  const f = "film-1", d1 = W(f, "Before"), mk = W(f, "and"), d2 = W(f, "Detection"), d3 = W(f, "This", 1), up = 21.2;
  const src = (t) => 7.68 + (t - d2);
  const s1 = [
    shot("made-up", 0, d1 - 0.1, { kind: "still source image", source: "billing.png", tag: ["r", "Test data. No real person or account."], take: "This screen is made up", trans: "Hard cut to the real app" }, () => ORIGINAL),
    shot("scan", d1 - 0.1, mk, { kind: "real action at source speed", source: "main 1.0-5.1", tag: ["l", "Recorded product. Nothing has been uploaded."], take: "Goal typed, example chosen, browser checks it locally", trans: "Hard cut to the picture" }, (t) => whole(mainFile(Math.min(1 + (t - (d1 - 0.1)), 4.89)))),
    shot("masks", mk, d2, { kind: "real masks revealed in spoken order", source: "billing.png and main 5.2", tag: ["r", "Masks from the recorded review, revealed in the order spoken."], take: "Black bars land word by word", trans: "Hard cut to the recorded review" }, (t) => ORIGINAL + maskLayer(MASKS.email, t, W(f, "email")) + maskLayer(MASKS.card, t, W(f, "card")) + maskLayer(MASKS.phone, t, W(f, "phone")) + maskLayer(MASKS.postcode, t, W(f, "postcode"))),
    shot("by-hand", d2, d3, { kind: "real brush at source speed", source: "main 7.68-15.2", tag: ["r", "Recorded brush at source speed. Yellow ticks added by this edit."], take: "Detection misses things; the person fixes them", trans: "Hard cut to Continue" }, (t) => review(Math.min(src(t), 16.1)) + tick(238, 277, t, W(f, "name"), d2 + (10.6 - 7.68)) + tick(394, 433, t, W(f, "expiry"), d2 + (13.1 - 7.68)) + tick(550, 589, t, W(f, "street"), d2 + (14.7 - 7.68)) + tab({ right: 80, y: 90, text: "Still readable: 3 fields", size: 54, t, at: W(f, "missed") })),
    shot("continue", d3, up, { kind: "real frame, held", source: "main 16.95 held", tag: ["l", "Recorded product, frame held."], take: "This screen cannot be skipped", trans: "Hard cut to the upload" }, () => product(16.95)),
    shot("upload", up, 25, { kind: "the captured upload", source: "raw/uploaded.jpg", tag: ["l", "Exact image captured from POST /v1/step in this take."], take: "Only this left the browser", trans: "Bars close" }, (t) => contained(UPLOAD_FILE, H) + tab({ x: 216, y: 18, text: "Only this image leaves the browser", size: 52, bg: SUN, color: INK, t, at: up + 0.3 })),
  ];

  const g = "film-2", ret = W(g, "and", 1), m = W(g, "At"), samA = W(g, "SAM"), ol = W(g, "outline"), keep = W(g, "ShowMe"), other = W(g, "Otherwise"), and = W(g, "and", 4);
  const STATES = [["Original", ORIGINAL], ["Masked in review", review(5.2)], ["Hidden by hand", review(16.1)], ["Uploaded", UPLOADED], ["Spark's box", stepPic(BOX)], ["SAM outline", stepPic(OUTLINE)]];
  const s2 = [
    shot("spark", 0, ret, { kind: "real upload, still", source: "raw/uploaded.jpg", tag: ["r", "The exact uploaded image, with the goal as sent."], take: "Spark reads the masked picture and the goal", trans: "Hard cut to the reply" }, () => UPLOADED + tab({ right: 80, y: 40, text: "Goal: Cancel my subscription", size: 54 })),
    shot("reply", ret, m, { kind: "real response fields", source: "raw/main-step-response.json", tag: ["l", "Fields from the actual reply in this take; others omitted."], take: "One action: which control, where, one sentence", trans: "Hard cut to figures" }, (t) => onGround(PAPER, INK, reply(t, { action: W(g, "one"), label: W(g, "which"), point: W(g, "where"), sentence: W(g, "one", 1) }))),
    shot("speed", m, samA, { kind: "measured figures", source: "eval/results via evidence.json", tag: ["l", `${groundSummary.n.toLocaleString("en-US")} recorded calls. Not the whole workflow.`], take: "Fast and cheap, grounding only", trans: "Hard cut to the recorded box" }, (t) => onGround(PAPER, INK, text(80, 300, 900, 240, 170, lift(`${groundSummary.latency_p50_ms.toLocaleString("en-US")} ms`, t, W(g, "2.8")), 800, INK, 1.2) + text(1000, 300, 860, 240, 170, lift(`$${(groundSummary.total_cost_usd / groundSummary.n).toFixed(4)}`, t, W(g, "under")), 800, INK, 1.2) + text(84, 540, 880, 70, 46, "median per grounding call", 600, MUTED, 1.2) + text(1004, 540, 850, 70, 46, "mean per grounding call", 600, MUTED, 1.2))),
    shot("box", samA, ol, { kind: "real recorded frame", source: "main frame 471", tag: ["r", "Recorded: Spark's box."], take: "Spark's box in the real product", trans: "The recording changes to the outline" }, () => stepPic(BOX)),
    shot("outline", ol, keep, { kind: "real recorded frame", source: "main frame 472", tag: ["r", "Recorded frame: the outline appears."], take: "SAM 3.1 tries to outline it", trans: "Hard cut to the gate" }, () => stepPic(OUTLINE)),
    shot("gate", keep, other, { kind: "diagram from real coordinates", source: "raw/main-refine-response.json", tag: ["l", "Values from this take, which passed all three checks."], take: "The outline stays only if the boxes agree", trans: "Hard cut to the box" }, (t) => gateDiagram(t, [W(g, "keeps"), W(g, "only"), W(g, "box", 0)])),
    shot("box-stays", other, and, { kind: "real recorded frame", source: "main frame 471", tag: ["r", "Recorded box. The rule: without agreement, this is what stays."], take: "Otherwise the box stays", trans: "Hard cuts through the states" }, () => stepPic(BOX)),
    shot("never-moves", and, 34.2, { kind: "registered real states with hard cuts", source: "billing.png, main 5.2 and 16.1, uploaded.jpg, main 471 and 472", tag: ["r", `Separate states, one registration. Crosshair added by this edit at Spark's point.`], take: "The picture changes. The point stays.", trans: "Bars close" }, (t) => { const i = clamp(Math.floor((t - and) / 0.75), 0, STATES.length - 1), [l, pic] = STATES[i]; return pic + crosshair(step.target.point.x, step.target.point.y) + tab({ x: 60, y: 14, text: l, size: 54 }) + tab({ right: 80, y: 40, text: `x ${step.target.point.x}, y ${step.target.point.y}`, size: 54, bg: SUN, color: INK }); }),
  ];

  const h = "film-3", ph = W(h, "On"), inst = W(h, "one"), hi = W(h, "one", 1), notice = hi + 2.3, guide = W(h, "control", 1), no = W(h, "No"), nx = W(h, "and", 2);
  const shareB = 2.9, srcB = (t) => 31.2 + (t - shareB);
  const instS = (t) => clamp(9.24 + (t - (ph)), 9.24, 12);
  const s3 = [
    shot("check-again", 0, shareB, { kind: "real screen at source speed", source: "main 28.0-30.9", tag: ["r", "Recorded product."], take: "Second review", trans: "Hard cut to consent" }, (t) => shareView(28 + t, 150)),
    shot("consent-link", shareB, ph, { kind: "real action at source speed", source: "main 31.2-35.4", tag: ["r", "Recorded product. Link token hidden by this edit."], take: "Consent, then a seven-day link", trans: "Hard cut to the phone" }, (t) => shareView(Math.min(srcB(t), 35.7), 440)),
    shot("instruction", ph, hi, { kind: "real phone, then frame held; same-frame enlargement", source: "phone 9.24-12.0", phone: [[9.24, 12]], tag: ["l", `${SELF} Right: detail held at source 11.8.`], take: "One instruction", trans: "Hard cut to the pinch" }, (t) => onGround(INK, PAPER, phoneCard(150, 32, 420, 900, instS(t)) + (t >= inst ? phoneCrop(740, 300, 1000, 300, 11.8, 60, 680, 0.943) : ""))),
    shot("pinch", hi, notice, { kind: "real pinch at source speed", source: "phone 16.4-18.2", phone: [[16.4, 18.25]], tag: ["l", `${SELF} Navigation cut. Recorded pinch.`], take: "One highlight, under a real thumb", trans: "Hard cut to the notice" }, (t) => hero(16.4 + (t - hi), H)),
    shot("notice", notice, guide, { kind: "real phone; same-frame enlargement", source: "phone 19.6-23", phone: [[19.6, 23.1]], tag: ["l", `${SELF} Right: detail held at source 22.5.`], take: "A picture, not remote control", trans: "Navigation cut to the original" }, (t) => { const s = clamp(19.6 + (t - notice), 19.6, 23); return onGround(INK, PAPER, phoneCard(150, 32, 420, 900, s) + phoneCrop(720, 230, 1100, 471, 22.5, 30, 310, 0.982)); }),
    shot("original", guide, no, { kind: "real phone at source speed", source: "phone 26.2-28.8", phone: [[26.2, 28.85]], tag: ["l", `${SELF} Navigation cut. Synthetic original in Photos, standing in for their own screen. Not sent by ShowMe.`], take: "The same button, unmarked", trans: "Continues" }, (t) => hero(26.2 + (t - guide), H, 860)),
    shot("unchanged", no, nx, { kind: "real phone, then frame held", source: "phone 28.85-29.6 held", phone: [[28.85, 29.6]], tag: ["l", `${SELF} Synthetic original in Photos, standing in for their own screen. Frame held after 29.6 s.`], take: "Nothing is changed", trans: "Navigation cut" }, (t) => hero(clamp(28.85 + (t - no), 28.85, 29.6), H, 860) + tab({ x: 16, y: 300, text: "Button", size: 48, bg: SUN, color: INK, t, at: no + 0.1 }) + tab({ x: 16, y: 386, text: "not pressed", size: 48, bg: SUN, color: INK, t, at: no + 0.15 })),
    shot("next", nx, 26, { kind: "real phone, then held detail", source: "phone 12.4-14.0, detail held at 14.0", phone: [[12.4, 14.01]], tag: ["l", `${SELF} Navigation cut. Right: detail held at source 14.0.`], take: "Another step needs another screenshot", trans: "Bars close" }, (t) => onGround(INK, PAPER, phoneCard(150, 32, 420, 900, clamp(12.4 + (t - nx), 12.4, 14)) + phoneCrop(720, 280, 1100, 376, 14, 30, 1170, 0.982))),
  ];

  const k = "film-4", b1 = W(k, "The"), b2 = W(k, "and"), b3 = W(k, "Tests"), b4 = W(k, "The", 1), b5 = W(k, "so");
  const redact = "apps/web/lib/redaction/redact.ts", client = "apps/web/lib/api/client.ts", spec = "apps/web/tests/e2e/priv-1.spec.ts", api = "backend/showme/api/main.py", runner = "eval/showme_eval/runner.py";
  const s4 = [
    shot("built", 0, b1, { kind: "real file, all lines redacted", source: `${redact} 105-115`, tag: ["l", "Real source lines. Black bars follow each line's length; added by this edit."], take: "A real repository", trans: "A line lifts" }, () => onGround(PAPER, INK, doc(redact, 105, 113, 112, "encodeCanvas(canvas)", -9, 99))),
    shot("re-encode", b1, b2, { kind: "real code line", source: `${redact} 112`, tag: ["l", "Actual source line. Other lines redacted by this edit."], take: "The browser re-encodes the reviewed image", trans: "Hard cut" }, (t) => onGround(PAPER, INK, doc(redact, 105, 113, 112, "encodeCanvas(canvas)", t, b1 + 0.8))),
    shot("only-type", b2, b3, { kind: "real code line", source: `${client} 212`, tag: ["l", "Actual source line. Other lines redacted by this edit."], take: "The client only accepts the redacted type", trans: "Hard cut" }, (t) => onGround(PAPER, INK, doc(client, 208, 216, 212, "RedactedImage", t, b2 + 1.3))),
    shot("test", b3, b4, { kind: "real code line", source: `${spec} 50-58`, tag: ["l", "Actual test line. Other lines redacted by this edit."], take: "Tests inspect the uploaded payload", trans: "Hard cut" }, (t) => onGround(PAPER, INK, doc(spec, 50, 58, 54, "not.toBe(originalDataUrl)", t, b3 + 0.5))),
    shot("same-core", b4, 19.5, { kind: "real code lines from two files", source: `${api} 52 and ${runner} 108`, tag: ["l", "Actual import lines. The benchmark does not run the browser's redaction or encoding."], take: "Evaluation runs the production core", trans: "Bars close" }, (t) => onGround(PAPER, INK, doc(api, 50, 53, 52, "ground", t, b4 + 0.4, 60, 76) + doc(runner, 105, 109, 108, "ground", t, W(k, "runs"), 450, 76))),
  ];

  const e = "film-5", hereEnd = 8.3, ga = W(e, "89.9"), pa = W(e, "62"), wa = W(e, "With"), na = W(e, "151"), ma = W(e, "Most"), la = W(e, "Live"), ta = W(e, "12");
  const cols = { ground: [49, 15, 4], pro: [24, 28, 5], abs: [20, 34, 6], e2e: [5, 120, 12] };
  const quick = (x, cells, c, n, l, m) => text(x, 70, 410, 130, 44, l, 800, INK, 1.14) + text(x, 205, 440, 130, 84, n, 800, INK, 1.2) + text(x, 340, 410, 150, 30, m, 600, MUTED, 1.25) + grid(cells, x, 510, c[0], c[1], c[2], 99, 0);
  const s5 = [
    shot("new-goal", 0, 4, { kind: "real upload, silent", source: "raw/uploaded.jpg; absent run goal", tag: ["r", `${SYN} Separate recorded call.`], take: "What if the control is not there?", trans: "Hard cut to the result" }, () => UPLOADED + tab({ right: 80, y: 60, text: "New goal: Download my 2019 tax invoice", size: 54 })),
    shot("not-visible", 4, hereEnd, { kind: "real product frame", source: "raw/absent-final.png; raw/absent-step-response.json", tag: ["l", `Real call: status ${absent.status}, action ${absent.action}. Synthetic screen. Frame held.`], take: "No highlight. It says so", trans: "Hard cut to the first figure" }, (t) => whole(ABSENT_FILE) + tab({ x: 110, y: 820, text: `status: ${absent.status}`, size: 58, bg: SUN, color: INK, t, at: 4.3 })),
    shot("grounding", hereEnd, pa - 0.36, { kind: "figure and per-example grid", source: "eval/results grounding predictions", tag: ["l", `Prompt v3, Spark minimal, SAM off. ${ev.grounding.uniqueImages} unique images. One square per example, file order.`], take: "What works", trans: "Hard cut" }, (t) => figureFrame({ label: "ScreenSpot-v2", number: `${ev.grounding.percent}%`, lines: [[`${ev.grounding.hits.toLocaleString("en-US")} hits, ${ev.grounding.n - ev.grounding.hits} misses`, W(e, "1,172")]], cells: groundCells, cols: cols.ground[0], size: cols.ground[1], gap: cols.ground[2], t, at: ga })),
    shot("pro", pa - 0.36, wa, { kind: "figure and per-example grid", source: "eval/results pro predictions", tag: ["l", "ScreenSpot-Pro. Prompt v3, SAM off. Yellow hit, black missed."], take: "What is harder", trans: "Hard cut" }, (t) => figureFrame({ label: "ScreenSpot-Pro", number: `${ev.pro.percent.replace(".0", "")}%`, lines: [[`${ev.pro.hits} hits, ${ev.pro.n - ev.pro.hits} misses`, pa + 0.5]], cells: proCells, cols: cols.pro[0], size: cols.pro[1], gap: cols.pro[2], t, at: pa })),
    shot("absent", wa, la, { kind: "figure and per-probe grid", source: "eval/results negatives predictions", tag: ["l", `${N.absentPairs} absent-target probes. Injection tests counted apart. Yellow: no highlight. Black: highlighted. Hollow: other.`], take: "What fails", trans: "Hard cut" }, (t) => onGround(PAPER, INK, text(80, 70, 860, 80, 50, "Right: no highlight") + text(80, 170, 890, 210, 170, lift(`${N.absentHits} / ${N.absentPairs}`, t, na), 800, INK, 1.1) + text(80, 410, 860, 80, 50, "Wrong: highlight anyway") + text(80, 510, 890, 210, 170, lift(`${N.absentMissesHighlighted} / ${N.absentPairs - N.absentHits}`, t, W(e, "still")), 800, INK, 1.1) + grid(absentCells, 1010, 90, cols.abs[0], cols.abs[1], cols.abs[2], t, na))),
    shot("live", la, 36.6, { kind: "figure and per-task grid", source: "eval/results e2e results.json", tag: ["l", "Not an unseen set. Run on the deployed product."], take: "What failed in public", trans: "Hard cut to the summary" }, (t) => figureFrame({ label: "End-to-end suite", number: `${ev.e2e.passed} / ${ev.e2e.n}`, lines: [[`${ev.e2e.n - ev.e2e.passed} tasks failed`, ta + 0.6], ["Read every trail: eval/results", W(e, "failures")]], cells: e2eCells, cols: cols.e2e[0], size: cols.e2e[1], gap: cols.e2e[2], t, at: ta, gridY: 170 })),
    shot("all-four", 36.6, 42, { kind: "summary of all four", source: "assets/evidence.json and eval/results", tag: ["l", `Prompt v3, Spark minimal, SAM off. ${N.overlappingPairs} image pair overlaps dev and reporting. Injection probes apart: ${N.injectionProbes} of ${N.injectionProbes}.`], take: "All four with their limits", trans: "Bars close" }, () => onGround(PAPER, INK, quick(70, groundCells, [34, 7, 3], `${ev.grounding.percent}%`, "Click point hit the target", `${ev.grounding.hits.toLocaleString("en-US")} of ${ev.grounding.n.toLocaleString("en-US")} held-out examples`) + quick(540, proCells, [20, 14, 5], `${ev.pro.percent}%`, "Harder professional apps", `${ev.pro.hits} of ${ev.pro.n} held-out examples`) + quick(1010, absentCells, [16, 18, 7], `${N.absentHits} / ${N.absentPairs}`, "Target absent: said not visible", `${N.absentMissesHighlighted} of the other ${N.absentPairs - N.absentHits} still highlighted`) + quick(1480, e2eCells, [5, 60, 10], `${ev.e2e.passed} / ${ev.e2e.n}`, "Live websites", "Development tasks, failures public"))),
  ];

  const c = "film-6", e1 = W(c, "Send"), e2 = W(c, "The"), e3 = W(c, "Try");
  const s6 = [
    shot("e-review", 0, e1, { kind: "real frame, held", source: "main 15.9", tag: ["r", "Recorded product, frame held."], take: "Review on your device", trans: "Hard cut" }, () => review(15.9)),
    shot("e-step", e1, e2, { kind: "real frame, held", source: "main frame 472", tag: ["r", "Real result, frame held."], take: "Send one clear step", trans: "Hard cut" }, () => stepPic(OUTLINE)),
    shot("e-control", e2, e3, { kind: "still source image", source: "billing.png", tag: ["r", `${SYN} No highlight.`], take: "The opening screen, and now they know where", trans: "Bars lift to the invitation" }, () => ORIGINAL),
    shot("close", e3, 15, { kind: "invitation", source: "typography", tag: null, take: "Destinations, readable and held", trans: "End" }, (t) => onGround(INK, PAPER, closeCard(t, e3, 150, 74, 60, 28))),
  ];
  return [s0, s1, s2, s3, s4, s5, s6];
}

function closeCard(t, at, big, u1, u2, note) {
  return text(140, 120, 1640, 80, 50, "Where do I press?", 600, MIST) + text(140, 200, 1640, big * 1.25, big, "ShowMe", 800, PAPER) + `<div style="position:absolute;left:144px;top:${200 + big * 1.22}px;width:${560 * ease((t - at - 0.1) / 0.3)}px;height:14px;background:${SUN}"></div>` + `<div data-inframe style="position:absolute;left:140px;top:${200 + big * 1.22 + 70}px;background:${SUN};color:${INK};font-size:${u1}px;line-height:1.2;font-weight:800;padding:8px 24px;white-space:nowrap">showme-web-delta.vercel.app</div>` + `<div data-inframe style="position:absolute;left:164px;top:${200 + big * 1.22 + 70 + u1 * 1.2 + 44}px;color:${PAPER};font-size:${u2}px;line-height:1.2;font-weight:700;white-space:nowrap">github.com/jeevesh2515/showme</div>` + text(164, 800, 1640, 100, note, "Built solo during the Meta Global AI Developer Hackathon. Indie Track, Build for Your World.<br>AI-generated narration.", 500, MIST, 1.35);
}

function xScenes() {
  const H = STAGE.x;
  const press = W("x-0", "On") - 0.3, hc = W("x-0", "neither") - 0.05;
  const a = W("x-1", "You"), b = W("x-1", "Only"), rv = (t) => 8.6 + (t - a);
  const s = W("x-2", "SAM"), on = W("x-2", "only"), finds = W("x-2", "finds");
  const y = W("x-3", "They"), hl = W("x-3", "one", 1), n1 = W("x-4", "not"), n2 = W("x-4", "151"), g = W("x-4", "and"), pub = W("x-4", "The");
  return [
    [
      shot("question", 0, press, { kind: "still source image", source: "billing.png", tag: ["r", "Synthetic screen. AI-generated narration."], take: "A form and one question", trans: "Hard cut: everything dims except the button" }, () => ORIGINAL + tab({ right: 60, y: 70, text: "Their goal: cancel this", size: 80 })),
      shot("there", press, hc, { kind: "real product result, frame held", source: "main frame 472", tag: ["r", "Real result, frame held."], take: "The answer on the same spot", trans: "Hard cut to pinch" }, (t) => stepPic(OUTLINE) + tab({ right: 60, y: 70, text: "There.", size: 92, bg: SUN, color: INK, t, at: press + 0.1 })),
      shot("hero", hc, 7.4, { kind: "real pinch at source speed", source: "phone 16.2-18.7", phone: [[16.2, 18.75]], tag: ["l", `${SELF} Recorded pinch.`], take: "A real thumb on the highlight", trans: "Bars close" }, (t) => hero(16.2 + (t - hc), H)),
    ],
    [
      shot("masks", 0, a, { kind: "real masks revealed in order", source: "billing.png and main 5.2", tag: ["r", "Recorded masks, shown in turn."], take: "Masks land in the browser", trans: "Hard cut to the brush" }, (t) => ORIGINAL + maskLayer(MASKS.email, t, 0.5) + maskLayer(MASKS.card, t, 0.95) + maskLayer(MASKS.phone, t, 1.4) + maskLayer(MASKS.postcode, t, 1.85) + tab({ right: 60, y: 70, text: "Nothing uploaded yet", size: 72 })),
      shot("by-hand", a, b, { kind: "real brush at source speed", source: "main 8.6-12.14", tag: ["r", "Recorded brush at source speed."], take: "You hide what it missed", trans: "Hard cut to the upload" }, (t) => review(rv(t)) + tab({ right: 60, y: 70, text: "Name still readable", size: 72 })),
      shot("upload", b, 8.4, { kind: "the captured upload", source: "raw/uploaded.jpg", tag: ["l", "Captured from POST /v1/step."], take: "Only then does it upload", trans: "Bars close" }, (t) => contained(UPLOAD_FILE, H) + tab({ x: 230, y: 8, text: "What the API receives", size: 62, bg: SUN, color: INK, t, at: b + 0.1 })),
    ],
    [
      shot("goal", 0, finds, { kind: "real upload", source: "raw/uploaded.jpg", tag: ["r", "The exact upload and goal."], take: "A goal and a masked picture", trans: "Hard cut to the box" }, () => UPLOADED + tab({ right: 60, y: 60, text: "Goal: Cancel my subscription", size: 64 })),
      shot("box", finds, s, { kind: "real recorded frame", source: "main frame 471", tag: ["r", "Recorded box. Synthetic screen."], take: "Muse Spark finds it", trans: "The recording changes to the outline" }, () => stepPic(BOX) + tab({ right: 60, y: 60, text: `x ${step.target.point.x}, y ${step.target.point.y}`, size: 72, bg: SUN, color: INK })),
      shot("outline", s, 8.0333, { kind: "real recorded frame", source: "main frame 472", tag: ["r", "Third main recording. Waits shortened."], take: "SAM outlines it when its box agrees", trans: "Bars close" }, (t) => stepPic(OUTLINE) + tab({ right: 60, y: 60, text: `Overlap ${iou.v.toFixed(2)}, needs 0.5`, size: 64, bg: SUN, color: INK, t, at: on })),
    ],
    [
      shot("link", 0, y, { kind: "real frame at source speed", source: "main 33.6-35.8", tag: ["r", "Recorded. Link token hidden by this edit."], take: "A seven-day link", trans: "Hard cut to the phone" }, (t) => shareView(Math.max(33.6, Math.min(33.6 + t, 35.7)), 440)),
      shot("instruction", y, hl, { kind: "real phone; same-frame enlargement", source: "phone 11.3-12.0, then held", phone: [[11.3, 12]], tag: ["l", `${SELF} Detail held at 11.8 s. Nothing cancelled.`], take: "One instruction", trans: "Hard cut to the pinch" }, (t) => { const q = clamp(11.3 + (t - y), 11.3, 12); return onGround(INK, PAPER, phoneCard(120, 24, 420, 900, q) + phoneCrop(640, 280, 1200, 360, 11.8, 60, 680, 1.132)); }),
      shot("highlight", hl, 5.6, { kind: "real pinch at source speed", source: "phone 16.9-18.17", phone: [[16.9, 18.2]], tag: ["l", `${SELF} A picture, not remote control.`], take: "One highlight", trans: "Bars close" }, (t) => hero(16.9 + (t - hl), H)),
    ],
    [
      shot("absent", 0, n2 - 0.1, { kind: "real product frame", source: "raw/absent-final.png", tag: ["l", "Separate real call. Goal: Download my 2019 tax invoice."], take: "It can say not visible", trans: "Hard cut to the figure" }, (t) => whole(ABSENT_FILE) + tab({ x: 110, y: 796, text: "No highlight drawn", size: 58, bg: SUN, color: INK, t, at: n1 })),
      shot("absent-figure", n2 - 0.1, g, { kind: "figure and per-probe grid", source: "eval/results negatives", tag: ["l", "Prompt v3, SAM off. Absent-target probes, one square each."], take: "With the failure beside it", trans: "Hard cut" }, (t) => onGround(PAPER, INK, text(70, 60, 900, 70, 58, "Right: no highlight") + text(70, 135, 960, 220, 170, lift(`${N.absentHits} / ${N.absentPairs}`, t, n2), 800, INK, 1.1) + text(70, 430, 900, 70, 58, "Wrong: highlight anyway") + text(70, 505, 960, 220, 170, lift(`${N.absentMissesHighlighted} / ${N.absentPairs - N.absentHits}`, t, n2 + 1.5), 800, INK, 1.1) + grid(absentCells, 1040, 90, 20, 34, 6, t, n2))),
      shot("grounding", g, pub, { kind: "figure and per-example grid", source: "eval/results grounding", tag: ["l", `${ev.grounding.hits.toLocaleString("en-US")} hits, ${ev.grounding.n - ev.grounding.hits} misses. ${ev.grounding.uniqueImages} images. SAM off.`], take: "Click point on target", trans: "Hard cut" }, (t) => onGround(PAPER, INK, text(70, 80, 800, 130, 56, "Click point inside the target") + text(70, 250, 860, 300, 240, lift(`${ev.grounding.percent}%`, t, W("x-4", "89.9")), 800, INK, 1.1) + grid(groundCells, 900, 120, 49, 15, 4, t, W("x-4", "89.9")))),
      shot("public", pub, 11.8333, { kind: "generated figures", source: "assets/evidence.json", tag: ["l", "Development tasks, not an unseen set."], take: "The failures stay visible", trans: "Bars close" }, (t) => onGround(INK, PAPER, text(120, 170, 800, 90, 60, "Harder apps", 700, MIST) + text(120, 270, 820, 240, 190, lift(`${ev.pro.percent}%`, t, pub + 0.05, SUN), 800, PAPER) + text(1020, 170, 800, 90, 60, "Live web tasks", 700, MIST) + text(1020, 270, 820, 240, 190, lift(`${ev.e2e.passed} / ${ev.e2e.n}`, t, pub + 0.4, SUN), 800, PAPER) + text(124, 590, 1680, 80, 56, "eval/results in the repository", 600, PAPER))),
    ],
    [shot("close", 0, 3.3334, { kind: "invitation", source: "typography", tag: null, take: "The question, answered with a destination", trans: "End" }, (t) => onGround(INK, PAPER, closeCard(t, 0, 130, 88, 66, 26)))],
  ];
}

const tagHtml = (tag, H, key) => {
  if (!tag) return "";
  const [side, s] = tag, size = key === "x" ? 36 : 27;
  return `<div data-inframe style="position:absolute;${side === "r" ? "right:0" : "left:0"};top:${H - size * 1.7}px;height:${size * 1.7}px;line-height:${size * 1.7}px;padding:0 20px;background:${INK};color:${PAPER};font-size:${size}px;font-weight:600;white-space:nowrap">${esc(s)}</div>`;
};
// Chapter wipe: six redaction strokes close over the outgoing frame and clear from the incoming one.
const BARS = 6, STAG = 0.02, DRAW = 0.1, WIPE = BARS * STAG + DRAW;
function wipes(t, dur, H, first, last) {
  const h = H / BARS;
  let out = "";
  if (!first && t < WIPE) for (let i = 0; i < BARS; i++) { const l = ease((t - i * STAG) / DRAW) * 1920; if (l < 1920) out += `<div style="position:absolute;left:${l}px;top:${i * h}px;width:${1920 - l}px;height:${h + 1}px;background:${INK}"></div>`; }
  const from = dur - WIPE - 1 / FPS;
  if (!last && t >= from) for (let i = 0; i < BARS; i++) { const r = ease((t - from - i * STAG) / DRAW) * 1920; if (r > 0) out += `<div style="position:absolute;left:0;top:${i * h}px;width:${r}px;height:${h + 1}px;background:${INK}"></div>`; }
  return out;
}

export const CSS = `@font-face{font-family:A;src:url(${url(join(root, "apps/web/fonts/atkinson-hyperlegible-next-latin.woff2"))});font-weight:200 800}
*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${INK};color:${INK};font-family:A,Arial,sans-serif}
.mono{font-family:Menlo,monospace}.cap{position:absolute;left:60px;top:990px;color:#fff;line-height:1.2;font-weight:600}`;

export function build(key) {
  const durs = timing[key], lists = key === "film" ? filmScenes() : xScenes(), H = STAGE[key];
  return lists.map((shots, i) => {
    const dur = durs[i], frames = Math.round(dur * FPS);
    shots.forEach((s, j) => { const n = shots[j + 1]; if (n && Math.abs(s.b - n.a) > 1e-6) throw new Error(`${key} scene ${i}: gap after ${s.id}`); if (s.b <= s.a) throw new Error(`${key} scene ${i}: empty shot ${s.id}`); });
    if (shots[0].a !== 0 || Math.abs(shots.at(-1).b - dur) > 1e-3) throw new Error(`${key} scene ${i}: shots do not fill ${dur}`);
    return { name: key === "film" ? `s${i + 1}` : `x${i}`, dur, frames, shots, frameAt(n) {
      const t = n / FPS, s = shots.find((x) => t < x.b - 1e-9) ?? shots.at(-1);
      return `<div style="position:absolute;left:0;top:0;width:1920px;height:${H}px;overflow:hidden;background:#fff">${s.frame(t)}${tagHtml(s.tag, H, key)}${wipes(t, dur, H, i === 0, i === lists.length - 1)}</div><div style="position:absolute;left:0;top:${H}px;width:1920px;height:${1080 - H}px;background:${INK}"></div>`;
    } };
  });
}
export const shotList = (key) => build(key).flatMap((scene) => scene.shots.map(({ id, a, b, kind, source, take, tag, trans, phone }) => ({ scene: scene.name, id, start: +a.toFixed(3), end: +b.toFixed(3), kind, source, takeaway: take, disclosure: tag ? tag[1] : "", transition: trans, ...(phone ? { phone } : {}) })));
