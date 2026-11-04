// "Locked": one fixed sheet for the whole film. No camera, no zoom, no pan. Every screen is whole and stays put;
// states dissolve in place. Footage is only placed and clipped; nothing draws over a recorded ring or mask.
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

export const FPS = 30;
const INK = "#16264a", SUN = "#ffd43b", MIST = "#e9eef6", MUTED = "#42506e";
export const STAGE = { x: 48, y: 40, w: 1280, h: 740 }; // screenshots sit at exactly 1:1
export const RIGHT = { x: 1376, y: 40, w: 496, h: 1000 };
// X has one line of caption below, so the screen can be larger. Same composition, fixed for the whole cut.
const LAYOUT = {
  film: { sx: 48, sy: 40, k: 1, rx: 1376, rw: 496, rh: 1000, wide: 1824, sh: 740, headTop: 794, headH: 70, headSize: 52, labelTop: 994, labelH: 60, labelSize: 27, labelLine: 30 },
  x: { sx: 24, sy: 24, k: 1.15, rx: 1520, rw: 376, rh: 851, wide: 1872, sh: 851, headTop: 882, headH: 72, headSize: 56, labelTop: 1030, labelH: 40, labelSize: 27, labelLine: 34 },
};
const FADE = 0.2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const W = (id, text, nth = 0) => {
  const seg = words[id], hits = seg.words.filter((w) => w.text.replace(/^[^\w]+|[^\w]+$/g, "") === text);
  if (!hits[nth]) throw new Error(`${id}: no word ${text}`);
  return seg.offset + hits[nth].start;
};
// One highlighter stroke: yellow grows behind ink text, once.
const swipe = (text, t, at) => `<span style="background:linear-gradient(${SUN},${SUN}) no-repeat 0 55%/${(clamp((t - at) / 0.3) * 100).toFixed(1)}% 88%;padding:0 .16em;margin-left:-.16em;box-decoration-break:clone;-webkit-box-decoration-break:clone">${esc(text)}</span>`;
const appear = (t, at, d = 0.25) => `opacity:${clamp((t - at) / d).toFixed(3)}`;
const at = (top, size, weight, html, extra = "") => `<div style="position:absolute;left:0;right:0;top:${top}px;font-size:${size}px;font-weight:${weight};line-height:1.12;${extra}">${html}</div>`;

const t0 = tl.frames[0].t;
const mainIndex = (t) => { let lo = 0, hi = tl.frames.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tl.frames[m].t - t0 <= t) lo = m; else hi = m - 1; } return lo; };
const mainFile = (t) => join(RAW, `main/f${String(tl.frames[mainIndex(t)].n).padStart(6, "0")}.jpg`);
const placed = (file, w, h, ox, oy, s) => `<img src="${url(file)}" style="position:absolute;left:0;top:0;width:${w}px;height:${h}px;transform-origin:0 0;transform:translate(${(-ox * s).toFixed(3)}px,${(-oy * s).toFixed(3)}px) scale(${s.toFixed(5)})">`;
const IMG = (file) => placed(file, 1280, 740, 0, 0, 1);
const ORIGINAL = IMG(join(root, "apps/web/public/examples/billing.png"));
const UPLOADED = IMG(join(RAW, "uploaded.jpg"));
// Review frames: the picture's rectangle comes from the measured button, so scrolling never shows.
// A frame with no measured button is mid page change, so the last clean frame holds instead.
const REVIEW_NATIVE = 1.16;
function review(t) {
  if (t > 16.5) throw new Error(`Review source ${t}s scrolls the picture out of frame`);
  let i = mainIndex(t);
  while (i > 0 && !tracks.main[tl.frames[i].n].blue) i--;
  const f = tl.frames[i], b = tracks.main[f.n].blue;
  return placed(join(RAW, `main/f${String(f.n).padStart(6, "0")}.jpg`), 2560, 1440, b[0] - 190 * REVIEW_NATIVE, b[1] - 614 * REVIEW_NATIVE, 1 / REVIEW_NATIVE);
}
const stepView = (t) => placed(mainFile(t), 2560, 1440, 304, 226, 1 / 0.881);
const BOX = 21, OUTLINE = 23;
const ABSENT_FILE = join(RAW, "absent-final.png");
const ABSENT = placed(ABSENT_FILE, 2560, 1440, 309.7, 233.8, 1 / 0.87);
// Consent and link: whole rows only, from the static part of the recording. The live link's token is hidden.
const SHARE = { x: 560, y: 645, s: 1280 / 1440, top: 56 };
function share(srcT) {
  const m = (a, b, c, d) => `<div style="position:absolute;left:${(a - SHARE.x) * SHARE.s}px;top:${(b - SHARE.y) * SHARE.s}px;width:${(c - a) * SHARE.s}px;height:${(d - b) * SHARE.s}px;background:#000"></div>`;
  return `<div style="position:absolute;inset:0;background:#fff"><div style="position:absolute;left:0;top:${SHARE.top}px;width:1280px;height:628px;overflow:hidden">${placed(mainFile(srcT), 2560, 1440, SHARE.x, SHARE.y, SHARE.s)}${srcT >= 33.59 ? m(1408, 972, 1900, 1028) + m(648, 1034, 740, 1082) : ""}</div></div>`;
}
// The product's instruction card as recorded, cropped above its keyboard hint.
const panel = (file) => `<div style="position:absolute;left:0;top:0;width:${RIGHT.w}px;height:${STAGE.h}px;overflow:hidden;background:#fff;border-radius:12px;outline:1.5px solid rgba(22,38,74,.22)"><div style="position:absolute;left:0;top:20px;width:${RIGHT.w}px;height:700px;overflow:hidden">${placed(file, 2560, 1440, 1495, 227, RIGHT.w / 761)}</div></div>`;
function phoneGuide(t) {
  if (t < 6.2 || t > 24.2) throw new Error(`Phone guide source ${t}s is outside the reviewed window`);
  return join(CACHE, `phone-a/${String(clamp(Math.round((t - 6.2) * FPS), 0, 539) + 1).padStart(5, "0")}.jpg`);
}
// The phone is always the same rectangle, never zoomed. The crop sits between the status bar and the browser pill, so no row is sliced.
const PHONE = { w: RIGHT.w, h: 958, crop: 146, s: RIGHT.w / 1180 };
const phone = (file) => `<div style="position:absolute;left:0;top:0;width:${PHONE.w}px;height:${PHONE.h}px;border-radius:24px;overflow:hidden;background:#fff;outline:2px solid ${INK}"><div style="position:absolute;left:0;top:16px;width:100%;height:${PHONE.h - 16}px;overflow:hidden">${placed(file, 1180, 2556, 0, PHONE.crop, PHONE.s)}</div></div>`;
// A highlighter mark in the margin beside the phone, like marking a printed page. It sits outside the recording.
const phoneY = (native) => RIGHT.y + 16 + (native - PHONE.crop) * PHONE.s;
const MARKS = { notice: [150, 610], instruction: [820, 1677], ring: [1530, 1650], note: [2022, 2387] };
// A still detail of the recorded highlight, from the phone's sharper frame. It never moves or scales.
const DETAIL = { x: 452, y: 1643, w: 330, h: 160 };
const detail = (top) => `<div style="position:absolute;left:0;top:${top}px;width:${RIGHT.w}px;height:${Math.round(DETAIL.h * RIGHT.w / DETAIL.w)}px;overflow:hidden;border-radius:12px;outline:1.5px solid rgba(22,38,74,.22);background:#fff">${placed(phoneGuide(17.4), 1180, 2556, DETAIL.x, DETAIL.y, RIGHT.w / DETAIL.w)}</div>`;

export const CSS = `@font-face{font-family:A;src:url(${url(join(root, "apps/web/fonts/atkinson-hyperlegible-next-latin.woff2"))});font-weight:200 800}
*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${MIST};color:${INK};font-family:A,Arial,sans-serif}
.mono{font-family:Menlo,monospace}.cap{position:absolute;left:50%;transform:translateX(-50%);bottom:42px;width:max-content;max-width:1640px;background:rgba(22,38,74,.94);color:#fff;font-size:40px;line-height:1.26;font-weight:600;padding:13px 30px;border-radius:12px;text-align:center}`;

const layer = (html, o) => `<div style="position:absolute;inset:0;opacity:${o.toFixed(3)}">${html}</div>`;
function sheet(cur, prev, t, key) {
  const L = LAYOUT[key], rk = L.rw / RIGHT.w;
  const raw = prev ? clamp((t - cur.a) / FADE) : 1, mix = raw * raw * (3 - 2 * raw);
  const both = (fn) => {
    if (mix >= 1) return cur.fn(fn, t);
    if (fn === "stage") return layer(prev.fn(fn), 1) + layer(cur.fn(fn, t), mix); // the outgoing picture stays solid underneath, so brightness never dips
    return layer(prev.fn(fn), 1 - clamp(mix / 0.4)) + layer(cur.fn(fn, t), clamp((mix - 0.4) / 0.6));
  };
  const scaled = (html) => (L.k === 1 ? html : `<div style="position:absolute;left:0;top:0;width:1280px;height:740px;transform-origin:0 0;transform:scale(${L.k})">${html}</div>`);
  const box = (w, html, o = 1) => `<div style="position:absolute;left:${L.sx}px;top:${L.sy}px;width:${w}px;height:${L.sh}px;overflow:hidden;background:#f3f4f6;border-radius:12px;outline:1.5px solid rgba(22,38,74,.22);opacity:${o.toFixed(3)}">${html}</div>`;
  const narrow = (html, o) => box(Math.round(1280 * L.k), scaled(html), o);
  const rightCol = (html) => `<div data-fit style="position:absolute;left:${L.rx}px;top:${L.sy}px;width:${L.rw}px;height:${L.rh}px;overflow:hidden"><div style="position:absolute;left:0;top:0;width:${RIGHT.w}px;height:${L.rh / rk}px;transform-origin:0 0;transform:scale(${rk})">${html}</div></div>`;
  let main;
  if (mix < 1 && !!prev.wide !== !!cur.wide) {
    // A wide sheet fades over the whole normal layout, so no panel changes shape on screen.
    main = cur.wide ? rightCol(prev.fn("right")) + narrow(prev.fn("stage")) + box(L.wide, cur.fn("stage", t), mix) : rightCol(cur.fn("right", t)) + narrow(cur.fn("stage", t)) + box(L.wide, prev.fn("stage"), 1 - mix);
  } else main = cur.wide ? box(L.wide, both("stage")) : rightCol(both("right")) + narrow(both("stage"));
  const note = cur.fn("note", t);
  const mark = cur.mark ? `<div style="position:absolute;left:${RIGHT.x - 14}px;top:${phoneY(MARKS[cur.mark][0]).toFixed(1)}px;width:10px;height:${(phoneY(MARKS[cur.mark][1]) - phoneY(MARKS[cur.mark][0])).toFixed(1)}px;background:${SUN};opacity:${clamp((t - cur.a) / FADE).toFixed(3)}"></div>` : "";
  return `${main}${mark}
<div data-fit style="position:absolute;left:${L.sx}px;top:${L.headTop}px;width:1500px;height:${L.headH}px;overflow:hidden;font-size:${L.headSize}px;line-height:${L.headH - 2}px;font-weight:800;white-space:nowrap">${both("head")}</div>
${note ? `<div data-fit style="position:absolute;left:${L.sx}px;top:866px;width:1824px;height:112px;overflow:hidden;font-size:30px;line-height:37px;font-weight:600">${note}</div>` : ""}<div data-fit style="position:absolute;left:${L.sx}px;top:${L.labelTop}px;width:${key === "x" ? 1872 : 1280}px;height:${L.labelH}px;overflow:hidden;font-size:${L.labelSize}px;line-height:${L.labelLine}px;font-weight:600;color:${MUTED}">${both("label")}</div>`;
}
const shot = (id, a, b, meta, parts) => ({ id, a, b, ...meta, ...parts });
function chain(list) {
  let last = {};
  return list.map((s) => {
    const m = { ...last, ...s };
    for (const k of ["stage", "right", "head", "label"]) if (m[k] === undefined) m[k] = () => "";
    m.fn = (name, t = m.b) => (typeof m[name] === "function" ? m[name](t) : m[name] ?? "");
    last = { stage: m.stage, right: m.right, head: m.head, label: m.label, wide: m.wide };
    return m;
  });
}
const SYN = "Synthetic billing screen, made up for this film.";
const REC = "Recorded in the product on the synthetic screen. Waits shortened, some frames held.";
const RECX = "Recorded in the product. Synthetic screen.";
const PHONE_LABEL = "Right: recorded guide, iPhone 16 self-demo, frame held. Left: the same picture, larger.";
const PHONE_LABEL2 = "Left: the synthetic original, with no highlight. Right: iPhone 16 self-demo. Nothing is cancelled.";
const PHONE_LABELX = "Right: recorded guide, iPhone 16 self-demo. Nothing is cancelled.";
const DETAIL_NOTE = (top) => at(top, 26, 600, "Same highlight, detail from the recorded guide, iPhone 16 self-demo.", `line-height:1.3;color:${MUTED}`);
const QUESTION = (sz) => at(170, sz, 800, "Where<br>do I<br>press?", "line-height:1.04") + at(170 + sz * 3.3, 38, 600, "Screenshot + goal:<br>Cancel my subscription", `line-height:1.22;color:${MUTED}`);
const THERE = (cut, sz) => (t) => at(90, 44, 600, "Where do I press?", `color:${MUTED}`) + at(160, sz, 800, swipe("There.", t, cut + 0.2), "line-height:1.1") + detail(370) + DETAIL_NOTE(620);
const CLOSE_STAGE = (e, big, url1, url2) => (t) => `<div style="position:absolute;inset:0;background:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center"><div style="font-size:48px;font-weight:600;color:${MUTED};margin-bottom:10px">Where do I press?</div><div style="font-size:${big}px;font-weight:800;line-height:1.14">${swipe("ShowMe", t, e + 0.2)}</div><div style="font-size:${url1}px;font-weight:700;margin-top:34px">showme-web-delta.vercel.app</div><div style="font-size:${url2}px;font-weight:700;margin-top:10px">github.com/jeevesh2515/showme</div></div>`;

function filmScenes() {
  const f0 = "film-0", cut = W(f0, "In"), stat = W(f0, "1,173"), pct = W(f0, "65"), who = W(f0, "ShowMe");
  const s0 = [
    shot("question", 0, cut, { kind: "still source image", src: "billing.png", take: "A form and one plain question", disc: SYN, trans: "Dissolve in place: the ring appears on the same button" }, { stage: ORIGINAL, right: QUESTION(112), label: SYN }),
    shot("there", cut, stat, { kind: "real recorded result, held, with a still detail", src: "main frame 472; phone 17.4 detail", take: "The useful answer, on the same spot", disc: "Real result; held", trans: "Right column changes" }, { stage: () => stepView(OUTLINE), right: THERE(cut, 130), label: REC }),
    shot("study", stat, who, { kind: "editorial beside held result", src: "docs/SUBMISSION.md section on the study", take: "Why it matters", disc: "Journal of Applied Gerontology, 2025", trans: "Right column changes" }, {
      right: (t) => at(90, 42, 600, "1,173 older internet users surveyed", "line-height:1.2") + at(220, 190, 800, "65%", `line-height:1;${appear(t, pct)}`) + at(425, 42, 600, "got tech help from family at least sometimes", `line-height:1.2;${appear(t, pct + 0.1)}`) + at(600, 26, 600, "Journal of Applied Gerontology, 2025", `color:${MUTED};${appear(t, pct + 0.2)}`) }),
    shot("for-helper", who, 18.3, { kind: "editorial beside held result", src: "main frame 472", take: "Who it is for", disc: "Real result; held", trans: "Dissolve to the original" }, {
      right: (t) => at(210, 110, 800, swipe("ShowMe", t, who + 0.2), "line-height:1.1") + at(370, 44, 600, "One clear next step, for the person who helps", "line-height:1.2") }),
  ];
  const f1 = "film-1", d1 = W(f1, "Before"), d2 = W(f1, "Detection"), d3 = W(f1, "This", 1), shotE = 21.2, wipeA = 21.7, wipeB = 23.4;
  const src = (t) => 7.68 + (t - d2);
  const tick = (label, on) => `<div style="display:flex;align-items:center;gap:18px;font-size:42px;font-weight:600;line-height:1.5"><span style="width:32px;height:32px;border-radius:7px;${on ? `background:${SUN};` : ""}outline:2.5px solid ${INK};display:inline-block"></span>${esc(label)}</div>`;
  const reviewList = (t) => at(40, 38, 700, "Found by the browser") + `<div style="position:absolute;left:4px;top:96px">${[["Email", "email"], ["Card number", "card"], ["Phone", "phone"], ["Postcode", "postcode"]].map(([l, w]) => `<div style="${appear(t, W(f1, w))}">${tick(l, true)}</div>`).join("")}</div>` + at(396, 38, 700, "Missed, hidden by hand", appear(t, d2)) + `<div style="position:absolute;left:4px;top:452px">${[["Name", "name", 10.79], ["Expiry", "expiry", 13.12], ["Street", "street", 14.68]].map(([l, w, real]) => `<div style="${appear(t, W(f1, w))}">${tick(l, src(t) > real)}</div>`).join("")}</div>`;
  const s1 = [
    shot("original", 0, d1, { kind: "still source image", src: "billing.png", take: "This screen is made up", disc: SYN, trans: "Dissolve in place: the masks appear" }, { stage: ORIGINAL, right: () => at(40, 60, 800, "A made-up billing screen", "line-height:1.1"), head: () => "", label: SYN }),
    shot("masks", d1, d2, { kind: "real recorded frame, held", src: "main 5.2", take: "The browser masks what it finds", disc: "Recorded; frame held", trans: "Continues into the real brushing" }, { stage: () => review(5.2), right: reviewList, head: (t) => swipe("On this device, before upload", t, d1 + 0.3), label: REC }),
    shot("by-hand", d2, d3, { kind: "real action, real time", src: "main 7.68-15.2", take: "Detection misses things; the person fixes them", disc: "Recorded", trans: "Right column stays" }, { stage: (t) => review(Math.min(src(t), 16.4)), head: (t) => swipe("It misses things", t, d2 + 0.2) }),
    shot("no-skip", d3, shotE, { kind: "real recorded frame, held", src: "main 16.4 held", take: "This review cannot be skipped", disc: "Recorded; frame held", trans: "Dissolve to the original, then to the upload" }, { stage: () => review(16.4), head: (t) => swipe("A required step", t, d3 + 0.2) }),
    shot("upload", shotE, 25, { kind: "one slow dissolve between two real files", src: "billing.png and raw/uploaded.jpg", take: "Exactly what left the browser", disc: "Captured from POST /v1/step in this take", trans: "Holds into Spark" }, {
      stage: (t) => `${ORIGINAL}<div style="position:absolute;inset:0;opacity:${(() => { const u = clamp((t - wipeA) / (wipeB - wipeA)); return (u * u * (3 - 2 * u)).toFixed(3); })()}">${UPLOADED}</div>`,
      right: () => at(250, 60, 800, "Only this image leaves the browser", "line-height:1.12"), head: () => "", label: "The exact upload, captured from POST /v1/step in this take." }),
  ];
  const f2 = "film-2", ret = W(f2, "and", 1), m = W(f2, "At"), samA = W(f2, "SAM"), samB = samA + 2.133, keep = W(f2, "ShowMe"), and = W(f2, "and", 4), states = and + 0.2, d = 0.86;
  const iou = (() => { const b = step.target.box, s = sam.box, i = Math.max(0, Math.min(b.x2, s.x2) - Math.max(b.x1, s.x1)) * Math.max(0, Math.min(b.y2, s.y2) - Math.max(b.y1, s.y1)), A = (r) => (r.x2 - r.x1) * (r.y2 - r.y1); return { v: i / (A(b) + A(s) - i), area: (A(s) / (1280 * 740)) * 100 }; })();
  const j = (t, when, k, v) => `<div style="${appear(t, when)};font-size:31px;line-height:1.28;margin-bottom:24px"><div class="mono" style="color:${MUTED}">"${k}":</div><div class="mono" style="font-weight:700">${esc(v)}</div></div>`;
  const gate = (t, when, l, v) => `<div style="${appear(t, when)};padding:18px 0;border-top:2px solid rgba(22,38,74,.22)"><div style="font-size:32px;font-weight:600;line-height:1.2">${esc(l)}</div><div style="font-size:64px;font-weight:800;line-height:1.12;margin-top:4px">${esc(v)}</div></div>`;
  const montage = [["Original", ORIGINAL], ["Masked in review", review(14.5)], ["Uploaded", UPLOADED], ["Spark's box", stepView(BOX)], ["SAM outline", stepView(OUTLINE)]];
  const s2 = [
    shot("spark", 0, ret, { kind: "real upload, still", src: "raw/uploaded.jpg", take: "Spark reads the masked picture and the goal", disc: "Real upload", trans: "Right column changes" }, { stage: UPLOADED, right: () => at(190, 84, 800, "Muse Spark 1.3", "line-height:1.06") + at(400, 40, 600, "Redacted screen + goal:<br>Cancel my subscription", "line-height:1.24"), head: () => "", label: "The exact uploaded image. Real call." }),
    shot("reply", ret, m, { kind: "real response fields", src: "raw/main-step-response.json", take: "One action: which control, where, one sentence", disc: "Actual reply from this take", trans: "Right column changes" }, {
      right: (t) => at(20, 38, 800, "Spark's actual reply") + `<div style="position:absolute;left:0;right:0;top:100px">${j(t, W(f2, "one"), "action", `"${step.action}"`)}${j(t, W(f2, "which"), "label", `"${step.target.label}"`)}${j(t, W(f2, "where"), "point", `{ x: ${step.target.point.x}, y: ${step.target.point.y} }`)}${j(t, W(f2, "one", 1), "instruction", `"${step.instruction}"`)}</div>`, head: (t) => swipe("One action, strict JSON", t, ret + 0.2), label: "Actual reply from this take, third main recording." }),
    shot("speed", m, samA, { kind: "measured figures", src: "eval/results via evidence.json; this call from main-step-response.json", take: "Fast and cheap, scoped to grounding", disc: "Grounding only, not the whole workflow", trans: "Dissolve to the recorded box" }, {
      right: (t) => at(70, 140, 800, "2.8 s", appear(t, W(f2, "2.8"))) + at(240, 100, 800, "under 1¢", appear(t, W(f2, "under"))) + at(400, 32, 600, `Median measured grounding call, prompt v3. Not the whole workflow.`, "line-height:1.3") + at(540, 28, 600, `This call: ${(step.timings_ms.ground / 1000).toFixed(1)} s, $${step.cost_usd.toFixed(4)}. Wait trimmed from the recording.`, `line-height:1.3;color:${MUTED}`), head: () => "", label: "Recorded measurements. Grounding only." }),
    shot("box", samA, samB, { kind: "real recorded frame, real time", src: "main frame 471, 20.18-22.31", take: "Spark's box in the real product", disc: "Recorded", trans: "Real recorded change, no dissolve" }, { stage: () => stepView(BOX), right: () => panel(mainFile(BOX)), head: (t) => swipe("Spark's box", t, samA + 0.2), label: REC }),
    shot("outline", samB, keep, { kind: "real recorded frame", src: "main frame 472, 22.32", take: "SAM 3.1 tries to outline it", disc: "Recorded", trans: "Right column changes" }, { fade: false, stage: () => stepView(OUTLINE), head: (t) => swipe("SAM 3.1 outline", t, samB + 0.1) }),
    shot("gate", keep, states, { kind: "real values beside held frame", src: "raw/main-refine-response.json", take: "The outline only stays if it agrees", disc: "Values from this take; frame held", trans: "Dissolves through the states" }, {
      right: (t) => at(20, 40, 800, "Agreement gate, this take", "line-height:1.2") + `<div style="position:absolute;left:0;right:0;top:130px">${gate(t, keep, "Box overlap, needs 0.5", iou.v.toFixed(2))}${gate(t, W(f2, "bounding"), "Contains Spark's point", `${step.target.point.x}, ${step.target.point.y}`)}${gate(t, W(f2, "agrees"), "Area of the image, limit 25%", `${iou.area.toFixed(1)}%`)}</div>`, head: (t) => swipe("Kept only if the boxes agree", t, keep + 0.2) }),
    shot("never-moves", states, 34.2, { kind: "dissolves between real states", src: "billing.png, main 14.5, uploaded.jpg, main frames 471, 472", take: "The picture changes. The point stays.", disc: "Separate states, same position", trans: "Dissolve to sharing" }, {
      stage: (t) => { const f = (t - states) / d, i = clamp(Math.floor(f), 0, montage.length - 1), mix = clamp((f - i) / 0.4); return montage[i][1] + (i + 1 < montage.length ? `<div style="position:absolute;inset:0;opacity:${mix.toFixed(3)}">${montage[i + 1][1]}</div>` : ""); },
      right: (t) => `<div style="position:absolute;left:0;right:0;top:110px">${montage.map(([l], i) => { const on = clamp(Math.floor((t - states) / d), 0, montage.length - 1) === i; return `<div style="font-size:44px;line-height:1.55;font-weight:700;color:${on ? INK : MUTED}">${on ? `<span style="background:${SUN};padding:0 .16em;margin-left:-.16em">${esc(l)}</span>` : esc(l)}</div>`; }).join("")}<div class="mono" style="font-size:44px;font-weight:700;margin-top:50px">x 482, y 632</div></div>`, head: (t) => swipe("The point stays put", t, and + 0.2), label: "Separate states, shown at the same position. Coordinates from Spark's reply." }),
  ];
  const f3 = "film-3", ph = W(f3, "On"), pic = W(f3, "It's"), own = W(f3, "the", 3), no = W(f3, "No"), nx = W(f3, "and", 2), shareStart = ph - 5.05;
  const guide = (t) => phone(phoneGuide(clamp(11.3 + (t - ph), 11.3, 12)));
  const s3 = [
    shot("share", 0, ph, { kind: "real action, real time; held at start", src: "main 30.65-35.7", take: "Second review, consent, then a seven-day link", disc: "Recorded; link token hidden by this edit", trans: "Dissolve to the original and the phone" }, {
      stage: (t) => share(clamp(30.65 + (t - shareStart), 30.65, 35.7)), right: (t) => at(240, 60, 800, `Review again.<br><span style="${appear(t, W(f3, "consent"))}">Consent.</span><br><span style="${appear(t, W(f3, "create"))}">Seven-day link.</span>`, "line-height:1.3"), head: (t) => swipe("Send it back", t, 0.4), label: "Recorded in the product. Link token hidden by this edit." }),
    shot("phone", ph, pic, { kind: "real phone footage, then held", src: "phone 11.3-12.0, held", take: "One instruction, one highlight", disc: "iPhone 16 self-demo", trans: "Same frame continues" }, { mark: "instruction", stage: () => stepView(OUTLINE), right: guide, head: (t) => swipe("One instruction, one highlight", t, ph + 0.2), label: PHONE_LABEL }),
    shot("not-remote", pic, own, { kind: "real phone footage, held", src: "phone 12.0 held", take: "A picture, not remote control", disc: "iPhone 16 self-demo; frame held", trans: "Headline changes" }, { mark: "notice", head: (t) => swipe("A picture, not remote control", t, pic + 0.2) }),
    shot("own-screen", own, no, { kind: "real phone footage, held", src: "phone 12.0 held", take: "The highlight lifts: same button, on the original", disc: "iPhone 16 self-demo; frame held", trans: "Headline changes" }, { mark: "ring", stage: ORIGINAL, label: PHONE_LABEL2, head: (t) => swipe("Find it on their own screen", t, own + 0.2) }),
    shot("unchanged", no, nx, { kind: "real phone footage, held", src: "phone 12.0 held", take: "Nothing is changed", disc: "iPhone 16 self-demo; frame held", trans: "Headline changes" }, { mark: "notice", head: (t) => swipe("No subscription changed", t, no + 0.2) }),
    shot("next", nx, 26, { kind: "real phone footage, held", src: "phone 12.0 held", take: "Another step needs another screenshot", disc: "iPhone 16 self-demo; frame held", trans: "Dissolve to the code sheet" }, { mark: "note", head: (t) => swipe("Next step, new screenshot", t, nx + 0.2) }),
  ];
  const f4 = "film-4", b1 = W(f4, "The"), b2 = W(f4, "and"), b3 = W(f4, "Tests"), b4 = W(f4, "The", 1), b5 = W(f4, "so");
  const blocks = (t) => [[b1, b2, "apps/web/lib/redaction/redact.ts", "const encoded = ", "encodeCanvas(canvas)", ";"], [b2, b3, "apps/web/lib/api/client.ts", "function imagePayload(image: ", "RedactedImage", ")"], [b3, b4, "apps/web/tests/e2e/priv-1.spec.ts", "expect(", "payload.image", ").not.toBe(originalDataUrl);"], [b4, 99, "backend/showme/api/main.py", "from showme.core.grounding import ", "ground", ""], [b4, 99, "eval/showme_eval/runner.py", "from showme.core.grounding import ", "ground", ""]].map(([a, z, path, pre, mark, post]) => { const on = t >= a && t < z; return `<div style="margin-bottom:38px;position:relative"><div style="position:absolute;left:-26px;top:0;bottom:0;width:12px;border-radius:3px;background:${on ? SUN : "transparent"}"></div><div style="font-size:27px;font-weight:600;color:${MUTED};margin-bottom:8px">${esc(path)}</div><div class="mono" style="font-size:38px;line-height:1.26;white-space:pre;font-weight:600;color:${on ? INK : MUTED}">${esc(pre)}${on ? swipe(mark, t, a + 0.15) : esc(mark)}${esc(post)}</div></div>`; }).join("");
  const claim = (t, a, z, s) => { const on = t >= a && t < z; return `<div style="font-size:42px;line-height:1.2;font-weight:700;color:${on ? INK : "#9aa6bd"};margin-bottom:48px">${esc(s)}</div>`; };
  const s4 = [
    shot("code", 0, 19.5, { kind: "real code, one fixed sheet", src: "redact.ts 112, client.ts 211-212, priv-1.spec.ts 54, api/main.py 52, runner.py 108", take: "The privacy boundary and shared core are real", disc: "Actual source excerpts, one signature joined onto one line", trans: "Dissolve to the absent case" }, {
      stage: (t) => `<div style="position:absolute;inset:0;background:#fff;padding:36px 48px">${blocks(t)}</div>`,
      right: (t) => `<div style="position:absolute;left:0;right:0;top:20px">${claim(t, b1, b2, "The browser re-encodes the reviewed image.")}${claim(t, b2, b3, "The API client only accepts that result.")}${claim(t, b3, b4, "Tests inspect the uploaded payload.")}${claim(t, b4, 99, "Evaluation runs the same grounding core.")}</div>`,
      head: (t) => (t < b1 ? swipe("Built during the hackathon", t, 0.2) : t < b4 ? swipe("Review before the network", t, b1 + 0.1) : swipe("Same core as production", t, b4 + 0.1)), label: (t) => (t < b5 ? "Actual source excerpts from the repository." : "The benchmark does not run the browser's redaction or encoding.") }),
  ];
  const f5 = "film-5", hereEnd = 8.3, N = ev.expectedNotVisible, rows = [
    { at: W(f5, "89.9"), l: "Click point hit the target", m: `${ev.grounding.hits.toLocaleString("en-US")} of ${ev.grounding.n.toLocaleString("en-US")} held-out examples, ScreenSpot-v2`, n: `${ev.grounding.percent}%`, until: W(f5, "62") },
    { at: W(f5, "62"), l: "Harder professional apps", m: `${ev.pro.hits} of ${ev.pro.n} held-out examples, ScreenSpot-Pro`, n: `${ev.pro.percent}%`, until: W(f5, "With") },
    { at: W(f5, "With"), l: "Target absent: said not visible", m: `${N.absentMissesHighlighted} of the other ${N.absentPairs - N.absentHits} still got a highlight`, n: `${N.absentHits} / ${N.absentPairs}`, until: W(f5, "Live") },
    { at: W(f5, "Live"), l: "Live websites", m: "Development tasks, not an unseen set. Failures are public in eval/results", n: `${ev.e2e.passed} / ${ev.e2e.n}`, until: 36.6 },
  ];
  const table = (t) => `<div style="position:absolute;inset:0;background:#fff;padding:0 44px">${rows.map((r, i) => { const on = t >= r.at && t < r.until; return `<div style="height:185px;display:flex;align-items:center;justify-content:space-between;${i < 3 ? `border-bottom:2px solid ${MIST}` : ""}"><div><div style="font-size:54px;font-weight:800;line-height:1.2;color:${on || t >= 36.6 ? INK : MUTED}">${esc(r.l)}</div><div style="font-size:36px;font-weight:600;line-height:1.3;color:${MUTED}">${esc(r.m)}</div></div><div style="font-size:124px;font-weight:800;line-height:1;white-space:nowrap">${on ? swipe(r.n, t, r.at + 0.05) : esc(r.n)}</div></div>`; }).join("")}</div>`;
  const s5 = [
    shot("new-goal", 0, 4, { kind: "real frame, silent", src: "raw/absent-final.png", take: "What if the control is not there?", disc: SYN, trans: "Right column reveals the product's answer" }, { stage: ABSENT, right: () => at(230, 40, 600, "New goal, same screen", `color:${MUTED}`) + at(290, 70, 800, "Download my 2019 tax invoice", "line-height:1.08"), head: () => "", label: `${SYN} Separate recorded call.` }),
    shot("not-visible", 4, hereEnd, { kind: "real frame", src: "raw/absent-final.png; raw/absent-step-response.json", take: "No ring. It says so", disc: "Real call: status not_visible, action scroll", trans: "Dissolve to the table" }, { right: () => panel(ABSENT_FILE), head: (t) => swipe("No highlight. It says so", t, 4.3), label: "Real call: status not_visible, action scroll. Synthetic screen." }),
    shot("evidence", hereEnd, 36.6, { kind: "evidence table, whole from the first frame; the voice walks through it", src: "eval/results via evidence.json", take: "Good and bad results, at the same size", disc: "Prompt v3, muse-spark-1.3 minimal, SAM off", trans: "Same sheet holds" }, { wide: true, stage: table, right: () => "", head: (t) => swipe("Recorded evaluations", t, hereEnd + 0.2), label: "Prompt v3, muse-spark-1.3 minimal, SAM off. Every figure is from eval/results." }),
    shot("limits", 36.6, 42, { kind: "evidence hold for reading", src: "docs/video/assets/evidence.json", take: "All four results with their limits", disc: "Injection, overlap, take selection", trans: "Dissolve to closing states" }, { fade: false, wide: true, stage: () => table(99), head: () => swipe("Recorded evaluations", 99, 0), note: `Injection probes counted apart: ${N.injectionProbes} of ${N.injectionProbes}. ${N.overlappingPairs} image pair overlaps dev and reporting.<br>Footage: third main recording, selected after earlier attempts.<br>Earlier attempts included a low box before the example was cropped.`, label: () => "" }),
  ];
  const f6 = "film-6", e1 = W(f6, "Send"), e2 = W(f6, "The"), e3 = W(f6, "Try");
  const line = (s) => () => at(250, 74, 800, esc(s), "line-height:1.1");
  const s6 = [
    shot("e-review", 0, e1, { kind: "real recorded frame", src: "main 14.5", take: "Review on your device", disc: "Recorded", trans: "Dissolve in place" }, { wide: false, stage: () => review(14.5), right: line("Review on your device."), head: () => "", label: REC }),
    shot("e-step", e1, e2, { kind: "real recorded frame with still detail", src: "main frame 472; phone 17.4 detail", take: "Send one clear step", disc: "Recorded", trans: "Dissolve in place" }, { stage: () => stepView(OUTLINE), right: () => at(110, 74, 800, "Send one clear step.", "line-height:1.1") + detail(370) + DETAIL_NOTE(620) }),
    shot("e-control", e2, e3, { kind: "still source image", src: "billing.png", take: "They stay in control", disc: SYN, trans: "Dissolve to the close" }, { stage: ORIGINAL, right: line("The person you help stays in control."), label: SYN }),
    shot("close", e3, 15, { kind: "the opening question, answered", src: "typography", take: "ShowMe, where the question was", disc: "Built solo; AI-generated narration", trans: "End" }, { wide: true, stage: CLOSE_STAGE(e3, 190, 66, 58), right: () => "", head: () => "", label: () => "", note: (t) => (t >= 10.05 ? `Built solo during the Meta Global AI Developer Hackathon. Indie Track, Build for Your World.<br>AI-generated narration.` : "") }),
  ];
  return [s0, s1, s2, s3, s4, s5, s6];
}

function xScenes() {
  const cut = W("x-0", "On");
  const x0 = [
    shot("question", 0, cut, { kind: "still source image", src: "billing.png", take: "A form and one plain question", disc: SYN, trans: "Dissolve in place: the ring appears" }, { stage: ORIGINAL, right: QUESTION(124), label: "Synthetic billing screen, made up for this film." }),
    shot("there", cut, 7.4, { kind: "real recorded result with still detail", src: "main frame 472; phone 17.4 detail", take: "The answer, on the same spot", disc: "Real result; held", trans: "Dissolve in place" }, { stage: () => stepView(OUTLINE), right: THERE(cut, 150), label: "Real result on the synthetic screen. Private details masked first." }),
  ];
  const tick = (label, on) => `<div style="display:flex;align-items:center;gap:18px;font-size:50px;font-weight:700;line-height:1.46"><span style="width:38px;height:38px;border-radius:8px;${on ? `background:${SUN};` : ""}outline:3px solid ${INK};display:inline-block"></span>${esc(label)}</div>`;
  const a = W("x-1", "You"), b = W("x-1", "Only"), rv = (t) => 7.68 + (t - a);
  const list = (t) => `<div style="position:absolute;left:4px;top:40px">${["Email", "Card number", "Phone", "Postcode"].map((l) => tick(l, true)).join("")}</div><div style="position:absolute;left:4px;top:370px">${tick("Name", rv(t) > 10.79)}</div>`;
  const x1 = [
    shot("masks", 0, a, { kind: "real recorded frame, held", src: "main 5.2", take: "Masked in the browser", disc: "Recorded; frame held", trans: "Continues" }, { stage: () => review(5.2), right: list, head: (t) => swipe("In your browser, before upload", t, 0.4), label: RECX }),
    shot("by-hand", a, b, { kind: "real action, real time", src: "main 7.68-11.2", take: "You hide what it missed", disc: "Selected excerpt", trans: "Dissolve to upload" }, { stage: (t) => review(rv(t)), head: (t) => swipe("You hide what it missed", t, a + 0.2), label: RECX }),
    shot("upload", b, 8.4, { kind: "real file", src: "raw/uploaded.jpg", take: "Only then does it upload", disc: "Captured from POST /v1/step", trans: "Holds" }, { stage: UPLOADED, right: () => at(280, 76, 800, "The exact upload", "line-height:1.08"), head: () => "", label: "Captured from POST /v1/step." }),
  ];
  const s = W("x-2", "SAM"), sb = s + 1.6, on = W("x-2", "only");
  const x2 = [
    shot("spark", 0, s, { kind: "real upload", src: "raw/uploaded.jpg", take: "Spark finds the one next control", disc: "Real call", trans: "Dissolve to the recorded box" }, { stage: UPLOADED, right: () => at(200, 44, 600, "Goal", `color:${MUTED}`) + at(260, 72, 800, "Cancel my subscription", "line-height:1.08"), head: (t) => swipe("Muse Spark 1.3", t, 0.3), label: "The exact upload. Real call." }),
    shot("box", s, sb, { kind: "real recorded frame", src: "main frame 471", take: "The real product", disc: "Recorded", trans: "Real recorded change" }, { stage: () => stepView(BOX), right: () => panel(mainFile(BOX)), head: (t) => swipe("Spark's box", t, s + 0.2), label: RECX }),
    shot("outline", sb, 8.0333, { kind: "real recorded frame", src: "main frame 472", take: "SAM outlines it when its box agrees", disc: "Value from this take", trans: "Dissolve to link" }, { fade: false, stage: () => stepView(OUTLINE), head: (t) => (t < on ? swipe("SAM 3.1 outline", t, sb + 0.1) : swipe("Box overlap 0.89, needs 0.5", t, on + 0.1)) }),
  ];
  const y = W("x-3", "They");
  const x3 = [
    shot("link", 0, y, { kind: "real frame", src: "main 34.2-35.7", take: "A seven-day link", disc: "Recorded; link token hidden", trans: "Dissolve to phone" }, { stage: (t) => share(Math.min(34.2 + t, 35.7)), right: () => at(280, 76, 800, "Then it expires", "line-height:1.08"), head: () => "", label: "Recorded in the product. Link token hidden by this edit." }),
    shot("phone", y, 5.6, { kind: "real phone footage, then held", src: "phone 11.3-12.0, held", take: "One instruction, one highlight, on the phone", disc: "iPhone 16 self-demo", trans: "Dissolve to the absent case" }, { wide: true, stage: (t) => `<div style="position:absolute;inset:0;background:#fff"><div style="position:absolute;left:60px;top:0;width:496px;height:958px;transform-origin:0 0;transform:scale(.888)">${phone(phoneGuide(clamp(11.3 + (t - y), 11.3, 12)))}</div><div style="position:absolute;left:640px;top:210px;font-size:120px;font-weight:800;line-height:1.1">One instruction.<br>${swipe("One highlight.", t, y + 1.2)}</div><div style="position:absolute;left:644px;top:530px;font-size:50px;font-weight:600;line-height:1.24;color:${MUTED}">A picture on the phone.<br>They press it on their own screen.</div></div>`, right: () => "", head: () => "", label: PHONE_LABELX }),
  ];
  const n1 = W("x-4", "151"), n2 = W("x-4", "89.9"), pub = W("x-4", "The"), N = ev.expectedNotVisible;
  const rowsX = [[n1, n2, "Target absent: said not visible", `${N.absentMissesHighlighted} of the other ${N.absentPairs - N.absentHits} still got a highlight`, `${N.absentHits} / ${N.absentPairs}`], [n2, pub, "Click point hit the target", `${ev.grounding.hits.toLocaleString("en-US")} of ${ev.grounding.n.toLocaleString("en-US")} held-out examples`, `${ev.grounding.percent}%`], [pub, 99, "Harder professional apps", `${ev.pro.hits} of ${ev.pro.n}. Live web: ${ev.e2e.passed} of ${ev.e2e.n} development tasks`, `${ev.pro.percent}%`]];
  const tableX = (t) => `<div style="position:absolute;inset:0;background:#fff;padding:0 44px">${rowsX.map(([a1, z, l, m, n], i) => { const live = t >= a1 && t < z; return `<div style="height:283px;display:flex;align-items:center;justify-content:space-between;${i < 2 ? `border-bottom:2px solid ${MIST}` : ""}"><div style="width:1160px"><div style="font-size:64px;font-weight:800;line-height:1.14;color:${live ? INK : MUTED}">${esc(l)}</div><div style="font-size:46px;font-weight:600;line-height:1.2;color:${MUTED}">${esc(m)}</div></div><div style="font-size:140px;font-weight:800;line-height:1;white-space:nowrap">${live ? swipe(n, t, a1 + 0.05) : esc(n)}</div></div>`; }).join("")}</div>`;
  const x4 = [
    shot("absent", 0, n1, { kind: "real frame", src: "raw/absent-final.png", take: "It can say not visible", disc: "Real call", trans: "Dissolve to figures" }, { stage: ABSENT, right: () => panel(ABSENT_FILE), head: (t) => swipe("No highlight. It says so", t, 0.3), label: "Real call: not_visible. Synthetic screen." }),
    shot("figures", n1, 11.8333, { kind: "evidence", src: "eval/results via evidence.json", take: "Results and failures, same size", disc: "Prompt v3, SAM off", trans: "Dissolve to close" }, { wide: true, stage: tableX, right: () => "", head: (t) => swipe("Recorded evaluations", t, n1 + 0.2), label: "Prompt v3, SAM off. Every figure is from eval/results." }),
  ];
  const x5 = [shot("close", 0, 3.3334, { kind: "the opening question, answered", src: "typography", take: "ShowMe, where the question was", disc: "AI-generated narration", trans: "End" }, { wide: true, stage: CLOSE_STAGE(0.2, 220, 76, 66), right: () => "", head: () => "", label: "AI-generated narration." })];
  return [x0, x1, x2, x3, x4, x5];
}

export function build(key) {
  const durs = timing[key], lists = (key === "film" ? filmScenes() : xScenes()).map(chain);
  const scenes = lists.map((shots, i) => {
    const dur = durs[i], frames = Math.round(dur * FPS);
    shots.forEach((s, j) => { const next = shots[j + 1]; if (next && Math.abs(s.b - next.a) > 1e-6) throw new Error(`${key} scene ${i}: gap after ${s.id}`); if (s.b <= s.a) throw new Error(`${key} scene ${i}: empty shot ${s.id}`); });
    if (shots[0].a !== 0 || Math.abs(shots.at(-1).b - dur) > 1e-3) throw new Error(`${key} scene ${i}: shots do not fill ${dur}`);
    return { name: key === "film" ? `s${i + 1}` : `x${i}`, dur, frames, shots };
  });
  return scenes.map((scene, i) => ({ ...scene, frameAt: (n) => {
    const t = n / FPS, found = scene.shots.findIndex((x) => t < x.b - 1e-9), idx = found < 0 ? scene.shots.length - 1 : found, s = scene.shots[idx];
    const prev = idx > 0 ? scene.shots[idx - 1] : i > 0 ? { ...scenes[i - 1].shots.at(-1), a: 0 } : null;
    return sheet(s, s.fade === false ? null : prev && t - s.a < FADE ? prev : null, t, key);
  } }));
}
export const shotList = (key) => build(key).flatMap((scene) => scene.shots.map(({ id, a, b, kind, src, take, disc, trans }) => ({ scene: scene.name, id, start: +a.toFixed(3), end: +b.toFixed(3), kind, source: src, takeaway: take, disclosure: disc, transition: trans })));
