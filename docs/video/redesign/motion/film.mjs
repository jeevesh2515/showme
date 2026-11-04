// "The point that doesn't move": every shot is a pure function of its local time, so frames are deterministic.
// Footage is only positioned and scaled. Nothing here draws over, repaints or moves a recorded ring or mask.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../../..");
const OUT = join(root, "docs/video/out"), RAW = join(OUT, "raw"), CACHE = join(OUT, "fixed-point-cache");
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const url = (p) => pathToFileURL(p).href;
const tracks = json(join(CACHE, "tracks.json")), tl = json(join(RAW, "main/timeline.json"));
const words = json(join(here, "words.json")), timing = json(join(here, "../timing.json"));
const step = json(join(RAW, "main-step-response.json")), sam = json(join(RAW, "main-refine-response.json"));
const ev = json(join(root, "docs/video/assets/evidence.json"));

export const FPS = 30;
export const P = { x: 960, y: 720 };
export const WIN = { x: 40, y: 64, w: 1840, h: 864 };
const INK = "#16264a", SUN = "#ffd43b", MIST = "#e9eef6", SCREEN = "#f3f4f6";
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, u) => a + (b - a) * u;
const inOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);
const out = (u) => 1 - (1 - u) ** 3;
const prog = (t, a, b, ease = inOut) => ease(clamp((t - a) / (b - a)));
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
// Word time inside its scene, from measured speech; nth picks a repeated word.
const W = (id, text, nth = 0) => {
  const seg = words[id], hits = seg.words.filter((w) => w.text.replace(/^[^\w]+|[^\w]+$/g, "") === text);
  if (!hits[nth]) throw new Error(`${id}: no word ${text}`);
  return seg.offset + hits[nth].start;
};

// Sources. Each returns the file and the measured source point of the button.
const t0 = tl.frames[0].t;
const mainIndex = (t) => { let lo = 0, hi = tl.frames.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (tl.frames[m].t - t0 <= t) lo = m; else hi = m - 1; } return lo; };
const MAIN = { w: 2560, h: 1440 };
const STEP_PT = [729.5, 783]; // box ring centre, which is the model's point in the step view
function mainAt(t) {
  let i = mainIndex(t);
  const file = join(RAW, `main/f${String(tl.frames[i].n).padStart(6, "0")}.jpg`);
  while (i > 0 && !tracks.main[tl.frames[i].n].blue && !tracks.main[tl.frames[i].n].ring) i--;
  const { blue, ring } = tracks.main[tl.frames[i].n];
  return { file, ...MAIN, pt: ring ? STEP_PT : [blue[0] + blue[2] / 2 + 0.94 * blue[2], blue[1] + blue[3] / 2] };
}
const PHONE = { w: 1180, h: 2556 };
const phoneRows = tracks.phone.a;
function phoneGuide(t) {
  if (t < 6.2 || t > 24.2) throw new Error(`Phone guide source ${t}s is outside the reviewed window`); // keyboard and app switcher stay excluded
  const i = clamp(Math.round((t - 6.2) * FPS), 0, phoneRows.length - 1);
  let r = phoneRows[i];
  for (let d = 1; !r && d < phoneRows.length; d++) r = phoneRows[i - d] ?? phoneRows[i + d];
  return { file: join(CACHE, `phone-a/${String(i + 1).padStart(5, "0")}.jpg`), ...PHONE, pt: [r[0], r[1]] };
}
function phoneOriginal(t) {
  if (t < 26.2 || t > 29.6) throw new Error(`Phone original source ${t}s is outside the reviewed window`);
  const i = clamp(Math.round((t - 26.2) * FPS), 0, tracks.phone.b.length - 1), b = tracks.phone.b[i];
  return { file: join(CACHE, `phone-b/${String(i + 1).padStart(5, "0")}.jpg`), ...PHONE, pt: [b[0] + b[2] / 2 + 0.94 * b[2], b[1] + b[3] / 2] };
}
const BILLING = { file: join(root, "apps/web/public/examples/billing.png"), w: 1280, h: 740, pt: [step.target.point.x, step.target.point.y] };
const UPLOADED = { file: join(RAW, "uploaded.jpg"), w: 1280, h: 740, pt: BILLING.pt };
const ab = tracks.absent;
const ABSENT = { file: join(RAW, "absent-final.png"), ...MAIN, pt: [ab[0] + ab[2] / 2 + 0.94 * ab[2], ab[1] + ab[3] / 2] };
const REVIEW_S = 1 / 1.13, STEP_S = 1 / 0.886; // screen pixels per screenshot pixel in the app views

// Pin the button to P at scale s.
const reg = (src, s, style = "") => `<img src="${url(src.file)}" style="position:absolute;left:0;top:0;width:${src.w}px;height:${src.h}px;transform-origin:0 0;transform:translate(${(P.x - WIN.x - src.pt[0] * s).toFixed(3)}px,${(P.y - WIN.y - src.pt[1] * s).toFixed(3)}px) scale(${s.toFixed(5)});${style}">`;
// Frame a region when no button is on screen: source point (cx, cy) goes to the window centre.
const free = (src, cx, cy, s) => `<img src="${url(src.file)}" style="position:absolute;left:0;top:0;width:${src.w}px;height:${src.h}px;transform-origin:0 0;transform:translate(${(WIN.w / 2 - cx * s).toFixed(3)}px,${(WIN.h / 2 - cy * s).toFixed(3)}px) scale(${s.toFixed(5)})">`;
// The link is a live bearer URL until it expires, so its token is hidden. Page is static from main 30.65 s; the link appears at 33.599 s.
const tokenMask = (srcT, cx, cy, s) => (srcT < 33.59 ? "" : [[1408, 972, 1900, 1028], [648, 1034, 740, 1082]].map(([a, b, c, d]) => `<div style="position:absolute;left:${(a - cx) * s + WIN.w / 2}px;top:${(b - cy) * s + WIN.h / 2}px;width:${(c - a) * s}px;height:${(d - b) * s}px;background:#000"></div>`).join(""));
const billing = (k) => ({ bg: SCREEN, win: reg(BILLING, k) });
const uploaded = (k) => ({ bg: SCREEN, win: reg(UPLOADED, k) });

// Marks: glide from the band ends to the point; reach it exactly at the cut.
const LOCK = { x: P.x, y: P.y, o: 1 };
const glide = (t, a, b, from = { x: 1800, y: 110 }) => { const u = prog(t, a, b); return { x: lerp(from.x, P.x, u), y: lerp(from.y, P.y, u), o: 1 }; };
const FOLD = { x: P.x, y: P.y, o: 0 };
const marks = (m) => `<div style="position:absolute;inset:0;opacity:${m.o.toFixed(3)}">
<i class="tk d" style="left:${m.x - 20}px;top:${WIN.y - 28}px"></i><i class="tk u" style="left:${m.x - 20}px;top:${WIN.y + WIN.h}px"></i>
<i class="tk r" style="left:${WIN.x - 28}px;top:${m.y - 20}px"></i><i class="tk l" style="left:${WIN.x + WIN.w}px;top:${m.y - 20}px"></i></div>`;
const rowTicks = (rows) => rows.map((r) => `<i style="position:absolute;left:8px;top:${r.y - 7}px;width:22px;height:14px;border-radius:3px;box-sizing:border-box;${r.on ? `background:${SUN}` : "border:2px solid #fff"}"></i>`).join("");

const plate = (h, inner, o = 1) => `<div style="position:absolute;left:0;top:0;width:${WIN.w}px;height:${h}px;background:${INK};opacity:${o.toFixed(3)};color:#fff;overflow:hidden">${inner}</div>`;
const fade = (t, a, d = 0.2) => clamp((t - a) / d);
const rise = (t, a) => `opacity:${fade(t, a, 0.23).toFixed(3)};transform:translateY(${((1 - out(clamp((t - a) / 0.3))) * 18).toFixed(2)}px)`;
const stack = (t, a) => `<div style="position:absolute;inset:0;${rise(t, a)}">`;

export const CSS = `@font-face{font-family:A;src:url(${url(join(root, "apps/web/fonts/atkinson-hyperlegible-next-latin.woff2"))});font-weight:200 800}
*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:${INK};color:#fff;font-family:A,Arial,sans-serif}
.tk{position:absolute;width:0;height:0;border:20px solid transparent}.tk.d{border-top:28px solid ${SUN};border-bottom:0}.tk.u{border-bottom:28px solid ${SUN};border-top:0}.tk.r{border-left:28px solid ${SUN};border-right:0}.tk.l{border-right:28px solid ${SUN};border-left:0}
.lb{position:absolute;top:0;height:${WIN.y}px;display:flex;align-items:center;font-weight:600;white-space:nowrap;overflow:hidden}
.mono{font-family:Menlo,monospace;font-weight:600}.hl{color:${SUN}}
.cap{position:absolute;left:50%;transform:translateX(-50%);bottom:12px;width:max-content;max-width:1760px;color:#fff;line-height:1.24;font-weight:600;text-align:center}`;

function frameHtml(s, key) {
  const fs = key === "x" ? 40 : 32;
  const label = s.label ? `<div class="lb" style="left:${WIN.x}px;font-size:${fs}px;max-width:${P.x - WIN.x - 30}px">${esc(s.label)}</div>` : "";
  const right = s.right ? `<div class="lb" style="right:${1920 - WIN.x - WIN.w}px;font-size:${fs}px;color:${MIST};max-width:${WIN.x + WIN.w - P.x - 30}px">${esc(s.right)}</div>` : "";
  return `<div style="position:absolute;left:${WIN.x}px;top:${WIN.y}px;width:${WIN.w}px;height:${WIN.h}px;overflow:hidden;background:${s.bg ?? INK}">${s.win ?? ""}${s.over ?? ""}</div>${label}${right}${marks(s.tk ?? LOCK)}${s.rows ? rowTicks(s.rows) : ""}${s.chrome ?? ""}`;
}

const realRing = "Real result on iPhone 16, self-demo";
const SYN = "Synthetic billing screen";
const WHERE = (t, a) => plate(372, `<div style="position:absolute;left:64px;top:44px;font-size:${150}px;font-weight:800;line-height:1.05;letter-spacing:-1.5px">Where do I press?</div><div style="position:absolute;left:68px;top:236px;font-size:46px;font-weight:600;color:${MIST}">Screenshot + goal: <span class="hl">Cancel my subscription</span></div>`);
const THERE = plate(188, `<div style="position:absolute;left:64px;top:62px;font-size:56px;font-weight:600;color:${MIST}">Where do I press?</div><div style="position:absolute;right:64px;top:16px;font-size:136px;font-weight:800;color:${SUN};line-height:1.1">There.</div>`);

const hookQuestion = (b) => ({
  id: "question", a: 0, b, kind: "editorial plate on synthetic source", src: "apps/web/public/examples/billing.png (unmarked original)",
  take: "A dense screen and one plain question", comp: "Question plate above, screen below, button on the fixed point", motion: "Slow push 1.55x to 2.3x about the point; marks glide in and arrive at the cut", disc: SYN, trans: "Hard registered cut",
  draw: (t) => ({ ...billing(lerp(1.55, 2.3, prog(t, 0, b, (u) => u))), over: WHERE(t), label: `${SYN}, made up`, tk: glide(t, 0.1, b) }),
});

// Scene shot lists. a/b are scene-local seconds.
function filmScenes() {
  const s0Cut = W("film-0", "In"), s0 = [
    hookQuestion(s0Cut),
    { id: "there", a: s0Cut, b: 18.3, kind: "real action, stabilised on the highlight; final frame held", src: "phone 17.2-24.0", take: "The useful result, then the reason it matters", comp: "Pinned ring, full width, pulling back to the phone with the study on the left", motion: "Founder's real pinch release, then a camera pull about the point", disc: "iPhone 16 self-demo; stabilised; frame held", trans: "Hard cut to the billing screen",
      draw: (t) => {
        const srcT = t < s0Cut + 1.8 ? 17.2 + (t - s0Cut) * 0.45 : Math.min(24, 18 + (t - s0Cut - 1.8));
        const s = lerp(1.6, 0.62, prog(t, 6.5, 8.4));
        const stat = fade(t, 8.3);
        return {
          bg: INK, win: reg(phoneGuide(srcT), s),
          over: (t < 6.6 ? THERE.replace(/opacity:1\.000/, `opacity:${(1 - fade(t, 6.3, 0.2)).toFixed(3)}`) : "") + `<div style="position:absolute;left:30px;top:96px;width:610px;opacity:${stat.toFixed(3)}">
            ${t < 14.6 ? `<div style="font-size:54px;font-weight:700;line-height:1.14">1,173 older internet users surveyed</div>
            <div style="${rise(t, 10.46)};font-size:190px;font-weight:800;color:${SUN};line-height:1.15;margin-top:16px">65%</div>
            <div style="${rise(t, 10.6)};font-size:42px;font-weight:600;line-height:1.2">got tech help from family at least sometimes</div>
            <div style="${rise(t, 10.8)};font-size:26px;margin-top:18px;color:${MIST}">Journal of Applied Gerontology, 2025</div>` : `<div style="${rise(t, 14.82)};font-size:132px;font-weight:800;margin-top:190px">ShowMe</div><div style="${rise(t, 14.95)};height:14px;width:430px;background:${SUN};margin-top:6px"></div><div style="${rise(t, 15.3)};font-size:48px;font-weight:600;margin-top:26px;line-height:1.16">One clear next step, for the person who helps</div>`}</div>`,
          label: realRing, right: t < s0Cut + 2.2 ? "Synthetic, recorded apart. Masked first" : t < 12 ? "Stabilised on the highlight" : "Frame held",
        };
      } },
  ];
  const rv = (k) => REVIEW_S * k, srcT = (t) => 7.68 + (t - W("film-1", "Detection"));
  const S1 = 1.46, S0 = 1.04, y = (img, k) => P.y - (632 - img) * k, wipeA = 21.1, wipeB = 22.7;
  const d1 = W("film-1", "Before"), d2 = W("film-1", "Detection"), d3 = W("film-1", "This", 1);
  const kAt = (t) => lerp(S0, S1, prog(t, W("film-1", "email") + 0.5, d2 - 0.1));
  const rows = (t) => { const k = kAt(t); return [
    t > W("film-1", "email") && { y: y(12, k), on: true }, t > W("film-1", "card") && { y: y(330, k), on: true }, t > W("film-1", "phone") && { y: y(489, k), on: true }, t > W("film-1", "postcode") && { y: y(568, k), on: true },
    t > W("film-1", "name") && { y: y(250, k), on: srcT(t) > 10.79 }, t > W("film-1", "expiry") && { y: y(409, k), on: srcT(t) > 13.12 }, t > W("film-1", "street") && { y: y(568, k) + 18, on: srcT(t) > 14.68 },
  ].filter((r) => r && r.y > WIN.y + 8); };
  const s1 = [
    { id: "original", a: 0, b: d1, kind: "held source image", src: "billing.png", take: "This screen is made up", comp: "The whole screenshot, button on the point", motion: "None; settle", disc: SYN, trans: "Registered cut: masks appear", draw: () => ({ ...billing(S0), label: `${SYN}, made up` }) },
    { id: "auto-masks", a: d1, b: d2, kind: "real frame held during narration", src: "main 5.18 held", take: "The browser masks some details before any upload", comp: "Same registration; left ticks mark each masked row", motion: "Slow push 1.04x to 1.46x about the point; ticks arrive with the words", disc: "Recorded take; frame held", trans: "Continues into the real brushing", draw: (t) => ({ bg: "#fff", win: reg(mainAt(5.2), rv(kAt(t))), label: "Masked in this browser, nothing uploaded yet", right: "Third main recording. Frame held", rows: rows(t) }) },
    { id: "manual", a: d2, b: d3, kind: "real action, real time, stabilised on the button", src: "main 7.68-15.0", take: "Detection misses things; the person fixes it", comp: "Whole form; hollow tick means missed, filled means hidden", motion: "None; the cursor is the only movement", disc: "Recorded take", trans: "Cut to the Continue line", draw: (t) => ({ bg: "#fff", win: reg(mainAt(Math.min(srcT(t), 16.5)), rv(S1)), label: "Automatic detection is partial. Hidden by hand", right: "Third main recording", rows: rows(t) }) },
    { id: "cannot-skip", a: d3, b: 20.75, kind: "real frame", src: "main 16.6-17.38 then held", take: "This step cannot be skipped", comp: "Recorded line and Continue button, large", motion: "None", disc: "Recorded take; frame held", trans: "Cut to the wipe", draw: (t) => ({ bg: "#fff", win: free(mainAt(Math.min(16.6 + (t - d3), 17.38)), 1280, 640, 1.14), label: "Review before upload", right: t < d3 + 0.78 ? "Third main recording" : "Frame held", tk: FOLD }) },
    { id: "wipe", a: 20.75, b: 25, kind: "editorial wipe between two real files", src: "billing.png and raw/uploaded.jpg", take: "Exactly what left the browser", comp: "Same registration; a seam wipes original into upload", motion: "One left-to-right wipe, then a read", disc: "Upload captured from POST /v1/step in this take", trans: "Cut with marks held", draw: (t) => {
      const seam = lerp(0, WIN.w, prog(t, wipeA, wipeB));
      return { bg: SCREEN, win: reg(BILLING, S1) + `<div style="position:absolute;left:0;top:0;width:${seam.toFixed(1)}px;height:100%;overflow:hidden;background:${SCREEN}">${reg(UPLOADED, S1)}</div><div style="position:absolute;left:${(seam - 3).toFixed(1)}px;top:0;width:6px;height:100%;background:${INK};opacity:${seam > 0 && seam < WIN.w ? 1 : 0}"></div>`, label: t < wipeB ? "Synthetic original, stays on this device" : "The exact image that left the browser", right: "Captured from POST /v1/step" };
    } },
  ];
  const f2 = "film-2", where = W(f2, "where"), m = W(f2, "At"), samA = W(f2, "SAM"), samB = samA + 2.133, oth = W(f2, "Otherwise"), and = W(f2, "and", 4), ret = W(f2, "and", 1);
  const iou = (() => { const b = step.target.box, s = sam.box, i = Math.max(0, Math.min(b.x2, s.x2) - Math.max(b.x1, s.x1)) * Math.max(0, Math.min(b.y2, s.y2) - Math.max(b.y1, s.y1)), A = (r) => (r.x2 - r.x1) * (r.y2 - r.y1); return { v: i / (A(b) + A(s) - i), area: (A(s) / (1280 * 740)) * 100 }; })();
  const jsonLine = (t, a, k, v) => `<div style="${rise(t, a)};font-size:42px;line-height:1.42"><span class="mono" style="color:${MIST}">"${k}": </span><span class="mono ${k === "point" ? "hl" : ""}">${esc(v)}</span></div>`;
  const montage = [["Original, synthetic", () => billing(2.1)], ["Masked in review", () => ({ bg: "#fff", win: reg(mainAt(14.5), rv(2.1)) })], ["Uploaded", () => uploaded(2.1)], ["Spark box", () => ({ bg: "#fff", win: reg(mainAt(21), STEP_S * 1.8) })], ["SAM outline", () => ({ bg: "#fff", win: reg(mainAt(23), STEP_S * 1.8) })]];
  const mA = and + 0.25, mD = 0.5;
  const outline = (t) => reg(mainAt(Math.min(22.4 + (t - samB), 26.5)), STEP_S * 1.8);
  const s2 = [
    { id: "spark-question", a: 0, b: ret, kind: "real uploaded image with editorial plate", src: "raw/uploaded.jpg", take: "Spark gets the masked picture and the goal", comp: "Plate above, uploaded image below, same point", motion: "Marks glide; they have not arrived", disc: "Real uploaded image", trans: "Plate content changes in place", draw: (t) => ({ ...uploaded(1.46), over: plate(372, `<div style="position:absolute;left:64px;top:52px;font-size:116px;font-weight:800">Muse Spark 1.3</div><div style="${rise(t, W(f2, "goal"))};position:absolute;left:68px;top:204px;font-size:50px;font-weight:600;color:${MIST}">Redacted screen + goal: <span class="hl">${esc(JSON.parse(readFileSync(join(RAW, "uploaded-meta.json"), "utf8")).goal)}</span></div>`), label: "The image that was uploaded", right: "Real call", tk: glide(t, 0.2, where + 12) }) },
    { id: "spark-json", a: ret, b: m, kind: "real response fields, editorial plate", src: "raw/main-step-response.json", take: "One action: which control, where, one sentence", comp: "Four lines revealed on the words; marks lock on the point value", motion: "Line reveals only", disc: "Actual reply from this take", trans: "Plate content changes in place", draw: (t) => ({ ...uploaded(1.46), over: plate(372, `<div style="position:absolute;left:64px;top:30px;right:40px"><div style="font-size:40px;font-weight:700;margin-bottom:8px;color:${MIST}">Spark's actual reply, strict JSON schema</div>${jsonLine(t, W(f2, "one"), "action", `"${step.action}"`)}${jsonLine(t, W(f2, "which"), "label", `"${step.target.label}"`)}${jsonLine(t, where, "point", `{ x: ${step.target.point.x}, y: ${step.target.point.y} }`)}${jsonLine(t, W(f2, "one", 1), "instruction", `"${step.instruction}"`)}</div>`), label: "Real response from this take", right: "Third main recording", tk: t < where ? glide(t, ret, where) : LOCK }) },
    { id: "spark-numbers", a: m, b: samA, kind: "evidence figures on editorial plate", src: "eval/results via docs/video/assets/evidence.json; this call from main-step-response.json", take: "Fast and cheap, scoped to grounding only", comp: "Two large figures, one scope line", motion: "Figures rise on their words", disc: "Measured grounding only, not the whole workflow", trans: "Hard cut to the recorded box", draw: (t) => ({ ...uploaded(1.46), over: plate(372, `<div style="position:absolute;left:64px;top:40px;display:flex;gap:110px"><div style="${rise(t, W(f2, "2.8"))};font-size:150px;font-weight:800;color:${SUN}">2.8 s</div><div style="${rise(t, W(f2, "under"))};font-size:150px;font-weight:800;color:${SUN}">under 1¢</div></div><div style="${rise(t, W(f2, "2.8"))};position:absolute;left:68px;top:232px;font-size:40px;font-weight:600;line-height:1.26">Median measured grounding call, prompt v3. Not the whole workflow.<br>This call: ${(step.timings_ms.ground / 1000).toFixed(1)} s, $${step.cost_usd.toFixed(4)}. Wait trimmed from the recording.</div>`), label: "Recorded measurements", right: "Grounding only" }) },
    { id: "box", a: samA, b: samB, kind: "real recorded frame, real time", src: "main frame 471, 20.18-22.31", take: "This is Spark's box in the real product", comp: "Recorded result, ring on the point", motion: "None", disc: "Recorded take", trans: "Real recorded change to the outline", draw: () => ({ bg: "#fff", win: reg(mainAt(21), STEP_S * 1.8), label: "Recorded: Spark's box", right: "Third main recording" }) },
    { id: "gate", a: samB, b: oth, kind: "real recorded frame, then held, with real gate values", src: "main frame 472, 22.32 onward; raw/main-refine-response.json", take: "SAM's outline only stays if it agrees", comp: "Gate rows above, outline at the point", motion: "Rows arrive one at a time", disc: "Values from this take; frame held", trans: "Cut back to the box", draw: (t) => ({ bg: "#fff", win: outline(t), over: plate(330, `<div style="position:absolute;left:64px;top:26px;right:60px"><div style="font-size:46px;font-weight:800;margin-bottom:12px">sam-3.1 agreement gate <span style="font-size:32px;font-weight:600;color:${MIST}">outline kept in this take</span></div>${[[W(f2, "ShowMe"), `Box overlap ${iou.v.toFixed(2)}`, "needs 0.5"], [W(f2, "bounding"), `Contains Spark's point ${step.target.point.x}, ${step.target.point.y}`, "must contain"], [W(f2, "agrees"), `Area ${iou.area.toFixed(1)}% of the image`, "limit 25%"]].map(([a, l, n]) => `<div style="${rise(t, a)};display:flex;justify-content:space-between;font-size:44px;font-weight:600;padding:9px 0;border-top:2px solid rgba(255,255,255,.22)"><span>${esc(l)}</span><span style="color:${MIST}">${esc(n)}</span></div>`).join("")}</div>`), label: "Recorded: SAM 3.1 outline", right: "Frame held" }) },
    { id: "box-stays", a: oth, b: mA, kind: "real recorded frame", src: "main frame 471", take: "If they disagree, this box remains", comp: "Recorded box at the point", motion: "None", disc: "Recorded box, shown again", trans: "Montage start", draw: () => ({ bg: "#fff", win: reg(mainAt(21), STEP_S * 1.8), label: "Recorded: Spark's box, shown again" }) },
    { id: "never-moves", a: mA, b: 34.2, kind: "signature registered montage of real states", src: "billing.png, main 14.5, uploaded.jpg, main frames 471, 472", take: "Everything changes around one point. The point does not move.", comp: "Same point, five labelled states, then the coordinates", motion: "Hard cuts every 0.5 s; no movement at all", disc: "Different recordings and files, labelled; not one live action", trans: "Hard cut to sharing", draw: (t) => {
      const i = Math.floor((t - mA) / mD);
      if (i < montage.length) return { ...montage[i][1](), label: montage[i][0], right: "Separate states, aligned by this edit" };
      return { bg: "#fff", win: reg(mainAt(23), STEP_S * 1.8), over: plate(236, `<div style="${rise(t, mA + montage.length * mD)};position:absolute;left:64px;top:40px;font-size:128px;font-weight:800" class="mono"><span class="hl">x 482, y 632</span></div>`), label: "The click point, from Spark's reply", right: "Frame held" };
    } },
  ];
  const f3 = "film-3", ph = W(f3, "On"), pic = W(f3, "It's"), gd = W(f3, "the", 3), own = W(f3, "their"), no = W(f3, "No"), anth = W(f3, "and", 2), s3End = 23.5;
  const s3 = [
    { id: "share", a: 0, b: ph, kind: "real action, real time", src: "main 28.61-35.7", take: "Second review, consent, then a seven-day link", comp: "Recorded panel, large; marks away because no button is targeted", motion: "None; the real page scrolls", disc: "Recorded take. Link token hidden by this edit. Runs to the source's last frame without a hold", trans: "Hard cut to the phone", draw: (t) => ({ bg: "#fff", win: free(mainAt(35.7 - ph + t), 1280, 900, 1.05) + tokenMask(35.7 - ph + t, 1280, 900, 1.05), label: "Second review and consent, then the link", right: 35.7 - ph + t < 33.59 ? "Third main recording" : "Link token hidden by this edit", tk: FOLD }) },
    { id: "phone", a: ph, b: pic, kind: "real action, stabilised on the highlight", src: "phone 11.0-15.65", take: "They get one instruction and one highlight", comp: "Phone column; the highlight stays pinned while the page scrolls around it", motion: "Founder's real scroll, stabilised; no camera move", disc: "iPhone 16 self-demo; stabilised", trans: "Cut to the notice", draw: (t) => ({ bg: INK, win: reg(phoneGuide(11 + (t - ph)), 0.85), label: "iPhone 16 self-demo", right: "Stabilised on the highlight" }) },
    { id: "notice", a: pic, b: gd, kind: "real footage, large", src: "phone 21.2-24.0, held", take: "The product itself says it is a picture", comp: "The recorded notice fills the frame", motion: "None; time to read", disc: "Product's own text; nothing retyped", trans: "Cut to the pinch", draw: (t) => ({ bg: "#fff", win: free(phoneGuide(Math.min(21.2 + (t - pic), 24)), 590, 505, 1.56), label: "The guide's own notice", right: "iPhone 16 self-demo", tk: FOLD }) },
    { id: "pinch", a: gd, b: own, kind: "real action, stabilised on the highlight", src: "phone 15.7-18.0", take: "The highlight grows under a real pinch", comp: "Ring pinned at the point, full width", motion: "Founder's real pinch", disc: "Stabilised", trans: "The main match cut: same place, same size, the real original", draw: (t) => ({ bg: INK, win: reg(phoneGuide(15.7 + (t - gd) * (2.3 / (own - gd))), 1.6), label: "iPhone 16 self-demo, recorded guide", right: "Stabilised on the highlight" }) },
    { id: "the-original", a: own, b: anth, kind: "real footage after a disclosed navigation cut; final frame held", src: "phone 28.6-29.6, held", take: "The same control, on the original screen", comp: "Registered to the guide frame, near identical size", motion: "None", disc: "Navigation cut; frame held", trans: "Cut to the product's next-step note", draw: (t) => ({ bg: "#000", win: reg(phoneOriginal(Math.min(28.6 + (t - own), 29.6)), 1.6), over: t >= no ? plate(150, `<div style="${rise(t, no)};position:absolute;left:64px;top:38px;font-size:68px;font-weight:800">No subscription changed. <span class="hl">Picture only.</span></div>`) : "", label: "iPhone 16 self-demo, the original in Photos", right: "Navigation cut. Frame held" }) },
    { id: "next-step", a: anth, b: s3End, kind: "real footage, large", src: "phone 11.2-12.0, held", take: "Another step needs another screenshot", comp: "The recorded note fills the frame", motion: "None; time to read", disc: "Product's own text", trans: "Cut back to the original", draw: (t) => ({ bg: "#fff", win: free(phoneGuide(Math.min(11.2 + (t - anth), 12)), 590, 2205, 1.56), label: "The guide's own note", right: "iPhone 16 self-demo. Frame held", tk: FOLD }) },
    { id: "unpressed", a: s3End, b: 26, kind: "held frame, silent", src: "phone 29.6 held", take: "They press it themselves", comp: "Original control at the point, plate above", motion: "Slow pull 1.6x to 1.3x about the point", disc: "Frame held", trans: "Hard cut to ink", draw: (t) => ({ bg: "#000", win: reg(phoneOriginal(29.6), lerp(1.6, 1.3, prog(t, s3End, 26, (u) => u))), over: plate(150, `<div style="position:absolute;left:64px;top:38px;font-size:68px;font-weight:800">A picture, not remote control.</div>`), label: "iPhone 16 self-demo, the original in Photos", right: "Frame held" }) },
  ];
  const f4 = "film-4", b1 = W(f4, "The"), b2 = W(f4, "and"), b3 = W(f4, "Tests"), b4 = W(f4, "The", 1);
  const code = (path, lines, size = 42) => `<div style="position:absolute;left:90px;right:60px;top:${Math.round(380 - (lines.length * size * 1.5) / 2)}px"><div style="font-size:38px;font-weight:600;color:${MIST};margin-bottom:34px">${esc(path)}</div>${lines.map((l) => `<div class="mono" style="font-size:${size}px;line-height:1.5;white-space:pre">${l}</div>`).join("")}</div>`;
  const hl = (s) => `<span class="hl">${esc(s)}</span>`;
  const s4 = [
    { id: "built", a: 0, b: b1, kind: "editorial", src: "narration", take: "Built during the hackathon", comp: "One line on ink", motion: "Rise", disc: "", trans: "Cut", draw: (t) => ({ over: `<div style="${rise(t, 0.15)};position:absolute;left:90px;top:280px;font-size:112px;font-weight:800;line-height:1.08">Built during<br>the hackathon</div>`, label: "How it holds up", tk: FOLD }) },
    { id: "reencode", a: b1, b: b2, kind: "real code, large", src: "apps/web/lib/redaction/redact.ts lines 110-124", take: "The browser re-encodes the reviewed image", comp: "Two real lines", motion: "Rise", disc: "Actual source excerpt", trans: "Cut", draw: (t) => ({ over: `<div style="position:absolute;inset:0;${rise(t, b1)}">${code("apps/web/lib/redaction/redact.ts", [`const encoded = ${hl("encodeCanvas(canvas)")};`, `return { dataUrl: encoded.dataUrl, meta, [brand]: true as const };`])}</div>`, label: "Actual source excerpt", tk: FOLD }) },
    { id: "only-accepts", a: b2, b: b3, kind: "real code, large", src: "apps/web/lib/api/client.ts lines 210-212", take: "The client only takes the redacted type", comp: "One real signature", motion: "Rise", disc: "Actual source excerpt", trans: "Cut", draw: (t) => ({ over: `<div style="position:absolute;inset:0;${rise(t, b2)}">${code("apps/web/lib/api/client.ts", [`function imagePayload(`, `  image: ${hl("RedactedImage")},`, `): Pick&lt;StepRequest, "image" | "image_meta"&gt;`], 62)}</div>`, label: "Actual source excerpt", tk: FOLD }) },
    { id: "tests", a: b3, b: b4, kind: "real code, large", src: "apps/web/tests/e2e/priv-1.spec.ts lines 51-54", take: "A test inspects what was really posted", comp: "Real test lines", motion: "Rise", disc: "Actual source excerpt", trans: "Cut", draw: (t) => ({ over: `<div style="position:absolute;inset:0;${rise(t, b3)}">${code("apps/web/tests/e2e/priv-1.spec.ts", [`const payload = JSON.parse(sent);`, `expect(${hl("payload.image")}).not.toBe(originalDataUrl);`], 58)}</div>`, label: "Actual source excerpt", tk: FOLD }) },
    { id: "same-core", a: b4, b: 19.5, kind: "real code, large", src: "backend/showme/api/main.py line 52; eval/showme_eval/runner.py line 108", take: "The evaluation runs the production grounding code", comp: "The identical import from two files, plus the limit", motion: "Rise, second file later", disc: "Benchmark does not run browser redaction", trans: "Cut to the absent case", draw: (t) => ({ over: `<div style="position:absolute;inset:0;${rise(t, b4)}"><div style="position:absolute;left:90px;right:90px;top:96px;font-size:34px;font-weight:600;color:${MIST}">backend/showme/api/main.py</div><div class="mono" style="position:absolute;left:90px;top:150px;font-size:54px">from showme.core.grounding import ${hl("ground")}</div></div><div style="position:absolute;inset:0;${rise(t, b4 + 1.3)}"><div style="position:absolute;left:90px;top:286px;font-size:34px;font-weight:600;color:${MIST}">eval/showme_eval/runner.py</div><div class="mono" style="position:absolute;left:90px;top:340px;font-size:54px">from showme.core.grounding import ${hl("ground")}</div></div><div style="position:absolute;left:90px;right:90px;top:540px;font-size:42px;font-weight:600;line-height:1.3;${rise(t, W(f4, "so"))}">Same grounding core as production.<br><span style="color:${MIST}">The benchmark does not run the browser's redaction or encoding.</span></div>`, label: "Actual source excerpt", tk: FOLD }) },
  ];
  const f5 = "film-5", hereEnd = 4 + 4.3, n1 = W(f5, "89.9"), n2 = W(f5, "62"), n3k = W(f5, "With"), n3 = W(f5, "151"), n3b = W(f5, "Most"), n4 = W(f5, "12"), n5 = W(f5, "the", 5), sum = 36.6;
  const N = ev.expectedNotVisible;
  const metric = (t, a, kicker, num, sub, sub2 = "", subAt = a) => `<div style="position:absolute;left:0;right:0;top:${sub2 ? 120 : 210}px;text-align:center;font-size:62px;font-weight:700;${rise(t, a - 0.1)}">${esc(kicker)}</div><div style="position:absolute;left:0;right:0;top:${P.y - WIN.y - 180}px;text-align:center;font-size:280px;line-height:1.28;font-weight:800;color:${SUN};${rise(t, a)}">${num}</div><div style="position:absolute;left:0;right:0;top:${P.y - WIN.y + 130}px;text-align:center;font-size:44px;font-weight:600;${rise(t, a + 0.1)}">${esc(sub)}</div>${sub2 ? `<div style="position:absolute;left:0;right:0;top:208px;text-align:center;font-size:54px;font-weight:800;${rise(t, subAt)}">${esc(sub2)}</div>` : ""}`;
  const tableRow = (l, m, s, d) => `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:13px 0;border-bottom:2px solid rgba(255,255,255,.22)"><div><div style="font-size:42px;font-weight:700">${esc(l)}</div><div style="font-size:30px;color:${MIST}">${esc(m)}</div></div><div style="font-size:76px;font-weight:800;color:${SUN}">${esc(s)}</div></div>`;
  const s5 = [
    { id: "absent-ask", a: 0, b: 4, kind: "real frame with editorial plate, silent", src: "raw/absent-final.png; goal from the recorded absent call", take: "What if the control is not there?", comp: "Plate with the new goal; marks searching", motion: "Marks glide and stop short of the point", disc: SYN, trans: "Pull back reveals the real answer", draw: (t) => ({ bg: "#fff", win: reg(ABSENT, 1.8), over: plate(236, `<div style="position:absolute;left:64px;top:30px;font-size:44px;font-weight:600;color:${MIST}">New goal, same screen</div><div style="position:absolute;left:64px;top:92px;font-size:88px;font-weight:800">Download my 2019 tax invoice</div>`), label: SYN, right: "Separate recorded call", tk: { x: lerp(1800, 1240, prog(t, 0.2, 3.6)), y: lerp(110, 440, prog(t, 0.2, 3.6)), o: 1 } }) },
    { id: "not-visible", a: 4, b: hereEnd, kind: "real frame", src: "raw/absent-final.png; raw/absent-step-response.json", take: "No ring. It says so", comp: "Whole page with no highlight; marks gone", motion: "Pull back to the whole page and instruction, then settle before it is read", disc: "Real call, status not_visible, action scroll", trans: "Cut to ink", draw: (t) => ({ bg: "#fff", win: (() => { const u = prog(t, 4, 5.2), sc = lerp(1.8, 0.94, u); return reg({ ...ABSENT, pt: [lerp(ABSENT.pt[0], 1280, u), lerp(ABSENT.pt[1], 640 + 224 / 0.94, u)] }, sc); })(), label: "Real call: status not_visible, action scroll", right: "Separate recorded call", tk: { ...P, o: 1 - fade(t, 4, 0.5) } }) },
    { id: "m-hit", a: hereEnd, b: n2, kind: "evidence", src: ev.sources.grounding, take: "Where the click point lands", comp: "Figure on the fixed point", motion: "Figure rises on its word, no count-up", disc: "Prompt v3, Spark minimal, SAM off", trans: "Same place", draw: (t) => ({ over: metric(t, n1, "The click point hit the target", `${ev.grounding.percent}%`, `${ev.grounding.hits.toLocaleString("en-US")} of ${ev.grounding.n.toLocaleString("en-US")} held-out examples, ScreenSpot-v2`), label: "Recorded evaluations", right: "Prompt v3, Spark minimal, SAM off" }) },
    { id: "m-pro", a: n2, b: n3k, kind: "evidence", src: ev.sources.pro, take: "Harder apps do worse, same prominence", comp: "Figure on the fixed point", motion: "Same", disc: "Prompt v3, Spark minimal, SAM off", trans: "Same place", draw: (t) => ({ over: metric(t, n2, "Harder professional apps", `${ev.pro.percent}%`, `${ev.pro.hits} of ${ev.pro.n} held-out examples, ScreenSpot-Pro`), label: "Recorded evaluations", right: "Prompt v3, Spark minimal, SAM off" }) },
    { id: "m-absent", a: n3k, b: W(f5, "Live"), kind: "evidence", src: ev.sources.negatives, take: "It says not visible, and sometimes still highlights", comp: "Figure on the point; the failure in type as heavy as the headline", motion: "Failure line arrives on its words", disc: "Prompt v3", trans: "Same place", draw: (t) => ({ over: metric(t, n3, "Target absent: said not visible", `${N.absentHits} / ${N.absentPairs}`, `${N.absentPercent}% of probes`, `${N.absentMissesHighlighted} of the other ${N.absentPairs - N.absentHits} still got a highlight`, n3b), label: "Recorded evaluations", right: "Prompt v3, Spark minimal, SAM off" }) },
    { id: "m-web", a: W(f5, "Live"), b: sum, kind: "evidence", src: ev.sources.e2e, take: "Live websites, with failures public", comp: "Figure on the point", motion: "Same", disc: "Development tasks, not an unseen set", trans: "Marks away; full table", draw: (t) => ({ over: metric(t, n4, "Live websites", `${ev.e2e.passed} / ${ev.e2e.n}`, "Development tasks, not an unseen set") + `<div style="position:absolute;left:0;right:0;top:124px;text-align:center;font-size:54px;font-weight:800;${rise(t, n5)}">Failures are public in eval/results</div>`, label: "Recorded evaluations", right: "Prompt v3, Spark minimal, SAM off" }) },
    { id: "m-table", a: sum, b: 42, kind: "evidence hold for reading", src: "docs/video/assets/evidence.json", take: "All four results together, with their limits", comp: "One readable table", motion: "Fixed; no animation over figures", disc: "Injection, overlap, take selection", trans: "Hard cut", draw: () => ({ over: `<div style="position:absolute;left:90px;right:90px;top:18px">${tableRow("ScreenSpot-v2 grounding", `${ev.grounding.hits.toLocaleString("en-US")} of ${ev.grounding.n.toLocaleString("en-US")} held-out examples`, `${ev.grounding.percent}%`)}${tableRow("ScreenSpot-Pro grounding", `${ev.pro.hits} of ${ev.pro.n} held-out examples`, `${ev.pro.percent}%`)}${tableRow("Said not visible, target absent", `${N.absentHits} of ${N.absentPairs} probes. ${N.absentMissesHighlighted} of the other ${N.absentPairs - N.absentHits} still got a highlight`, `${N.absentPercent}%`)}${tableRow("Live-web development tasks", "Not an unseen task set", `${ev.e2e.passed} / ${ev.e2e.n}`)}<div style="font-size:29px;line-height:1.34;margin-top:16px;color:${MIST}">Injection probes counted apart: ${N.injectionProbes} of ${N.injectionProbes}. ${N.overlappingPairs} image pair overlaps dev and reporting. Footage: third main recording, selected after earlier attempts. Earlier attempts included a low box before the example was cropped.</div></div>`, label: "Recorded evaluations", right: "Prompt v3, Spark minimal, SAM off", tk: FOLD }) },
  ];
  const f6 = "film-6", e1 = W(f6, "Send"), e2 = W(f6, "The"), e3 = W(f6, "Try");
  const s6 = [
    { id: "e-review", a: 0, b: e1, kind: "real frame", src: "main 14.83", take: "Review on your device", comp: "Registered masks", motion: "None", disc: "Recorded take", trans: "Registered cut", draw: () => ({ bg: "#fff", win: reg(mainAt(14.83), REVIEW_S * 1.8), label: "Review on your device" }) },
    { id: "e-step", a: e1, b: e2, kind: "real frame", src: "phone 17.4", take: "Send one clear step", comp: "Registered ring", motion: "None", disc: "iPhone 16 self-demo", trans: "Registered cut", draw: () => ({ bg: INK, win: reg(phoneGuide(17.4), 1.6), label: "Send one clear step", right: "iPhone 16 self-demo" }) },
    { id: "e-control", a: e2, b: e3, kind: "real frame", src: "phone 29.0", take: "They stay in control", comp: "Registered original", motion: "None", disc: "iPhone 16 self-demo", trans: "Registered cut back to the opening composition", draw: () => ({ bg: "#000", win: reg(phoneOriginal(29), 1.6), label: "They stay in control", right: "iPhone 16 self-demo" }) },
    { id: "close", a: e3, b: 15, kind: "editorial plate on synthetic source", src: "billing.png", take: "ShowMe, in the place the question was", comp: "The opening frame's exact layout, answered", motion: "Yellow underline draws once", disc: "Built solo; AI-generated narration", trans: "End", draw: (t) => ({ ...billing(1.55), over: plate(430, `<div style="position:absolute;left:64px;top:30px;font-size:150px;font-weight:800;line-height:1.05">ShowMe</div><div style="position:absolute;left:70px;top:196px;height:13px;background:${SUN};width:${(620 * prog(t, e3 + 0.1, e3 + 0.7)).toFixed(1)}px"></div><div style="position:absolute;left:68px;top:232px;font-size:60px;font-weight:700;${rise(t, e3 + 0.3)}">showme-web-delta.vercel.app</div><div style="position:absolute;left:68px;top:314px;font-size:60px;font-weight:700;${rise(t, W(f6, "read"))}">github.com/jeevesh2515/showme</div>`), label: SYN, chrome: t >= 10.1 ? `<div style="position:absolute;left:0;right:0;top:${WIN.y + WIN.h + 26}px;text-align:center;font-size:30px;font-weight:600;line-height:1.36;opacity:${fade(t, 10.1, 0.3).toFixed(3)}">Built solo during the Meta Global AI Developer Hackathon. Indie Track, Build for Your World.<br>AI-generated narration.</div>` : "" }) },
  ];
  return [s0, s1, s2, s3, s4, s5, s6];
}

function xScenes() {
  const rv = (k) => REVIEW_S * k, c = W("x-0", "On");
  const x0 = [hookQuestion(c), { id: "there", a: c, b: 7.4, kind: "real action, stabilised on the highlight", src: "phone 17.2-19.8", take: "The answer, immediately", comp: "Pinned ring, full width, answer above", motion: "Real pinch release", disc: "iPhone 16 self-demo; stabilised", trans: "Registered cut", draw: (t) => ({ bg: INK, win: reg(phoneGuide(t < c + 1.2 ? 17.2 + (t - c) * 0.5 : Math.min(17.8 + (t - c - 1.2), 19.8)), 1.6), over: THERE, label: realRing, right: t < c + 2.2 ? "Synthetic, recorded apart. Masked first" : "Stabilised on the highlight" }) }];
  const a = W("x-1", "You"), b = W("x-1", "Only"), hold = a + 3.0;
  const x1 = [
    { id: "masks", a: 0, b: a, kind: "real frame held", src: "main 5.2", take: "Masked in the browser", comp: "Whole form, big plate-free", motion: "None", disc: "Recorded; frame held", trans: "Registered cut", draw: (t) => ({ bg: "#fff", win: reg(mainAt(5.2), rv(1.46)), over: plate(190, `<div style="${rise(t, 0.1)};position:absolute;left:64px;top:44px;font-size:92px;font-weight:800">Masked <span class="hl">before upload</span></div>`), label: "Synthetic screen, in your browser", right: "Frame held" }) },
    { id: "brush", a, b: hold, kind: "real action, real time", src: "main 7.68-10.68", take: "You hide what it missed", comp: "Whole form", motion: "Cursor only", disc: "Selected excerpts", trans: "Jump cut to the taps", draw: (t) => ({ bg: "#fff", win: reg(mainAt(7.68 + (t - a)), rv(1.46)), label: "You hide what it missed", right: "Synthetic. Selected excerpts" }) },
    { id: "tap", a: hold, b, kind: "real action, real time", src: "main 13.1-14.8", take: "You hide what it missed", comp: "Whole form", motion: "Cursor only", disc: "Selected excerpts", trans: "Cut to the upload", draw: (t) => ({ bg: "#fff", win: reg(mainAt(13.1 + (t - hold)), rv(1.46)), label: "You hide what it missed", right: "Synthetic. Selected excerpts" }) },
    { id: "upload", a: b, b: 8.4, kind: "real file", src: "raw/uploaded.jpg", take: "Only then does it upload", comp: "Exact image", motion: "None", disc: "Captured from POST /v1/step", trans: "Registered", draw: () => ({ ...uploaded(1.46), label: "The exact image that left the browser", right: "Synthetic screen" }) },
  ];
  const s = W("x-2", "SAM"), sb = s + 1.6;
  const x2 = [
    { id: "spark", a: 0, b: s, kind: "real file with plate", src: "raw/uploaded.jpg", take: "Spark finds the one next control", comp: "Plate above", motion: "Marks lock", disc: "Real call", trans: "Hard cut", draw: (t) => ({ ...uploaded(1.46), over: plate(260, `<div style="position:absolute;left:64px;top:50px;font-size:112px;font-weight:800;line-height:1.05">Muse Spark <span class="hl">finds it</span></div>`), label: "Meta's Muse Spark 1.3", right: "Synthetic screen. Real call", tk: glide(t, 0.1, W("x-2", "control")) }) },
    { id: "box", a: s, b: sb, kind: "real frame", src: "main frame 471", take: "Spark's box", comp: "Recorded ring", motion: "None", disc: "Third main recording", trans: "Real recorded change", draw: () => ({ bg: "#fff", win: reg(mainAt(21), STEP_S * 1.8), label: "Recorded: Spark's box", right: "Synthetic screen" }) },
    { id: "outline", a: sb, b: 8.0333, kind: "real frame", src: "main frame 472", take: "SAM outlines it when the box agrees", comp: "Recorded outline, single gate value", motion: "None", disc: "Value from this take", trans: "Hard cut", draw: (t) => ({ bg: "#fff", win: reg(mainAt(23), STEP_S * 1.8), over: plate(200, `<div style="${rise(t, W("x-2", "only"))};position:absolute;left:64px;top:44px;font-size:84px;font-weight:800">SAM 3.1 box overlap <span class="hl">0.89</span>, needs 0.5</div>`), label: "Recorded: SAM 3.1 outline", right: "Synthetic screen" }) },
  ];
  const y = W("x-3", "They"), z = W("x-3", "highlight") + 0.2;
  const x3 = [
    { id: "link", a: 0, b: y, kind: "real frame", src: "main 34.0-35.7", take: "A seven-day link", comp: "Recorded link", motion: "None", disc: "Recorded take. Link token hidden by this edit", trans: "Hard cut", draw: (t) => ({ bg: "#fff", win: free(mainAt(Math.min(34 + t, 35.7)), 1280, 1040, 1.4) + tokenMask(34, 1280, 1040, 1.4), label: "Send a seven-day link", right: "Link token hidden by this edit", tk: FOLD }) },
    { id: "pinch", a: y, b: z, kind: "real action, stabilised", src: "phone 15.7-18.0", take: "One instruction, one highlight", comp: "Pinned ring, full width", motion: "Real pinch", disc: "iPhone 16 self-demo; stabilised", trans: "Main match cut", draw: (t) => ({ bg: INK, win: reg(phoneGuide(15.7 + (t - y) * (2.3 / (z - y))), 1.6), label: "iPhone 16 self-demo, synthetic screen", right: "Stabilised on the highlight" }) },
    { id: "original", a: z, b: 5.6, kind: "real footage", src: "phone 28.8", take: "Find it on the original", comp: "Registered original", motion: "None", disc: "Navigation cut", trans: "Hard cut", draw: () => ({ bg: "#000", win: reg(phoneOriginal(28.8), 1.6), label: "iPhone 16 self-demo, the original", right: "Navigation cut. Nothing cancelled" }) },
  ];
  const n1 = W("x-4", "151"), n2 = W("x-4", "89.9"), pub = W("x-4", "The"), N = ev.expectedNotVisible;
  const bigNum = (t, a, kicker, num, sub, sub2) => `<div style="position:absolute;left:0;right:0;top:64px;text-align:center;font-size:72px;font-weight:700;${rise(t, a - 0.15)}">${esc(kicker)}</div><div style="position:absolute;left:0;right:0;top:${P.y - WIN.y - 240}px;text-align:center;font-size:290px;line-height:1.1;font-weight:800;color:${SUN};${rise(t, a)}">${num}</div><div style="position:absolute;left:0;right:0;top:${P.y - WIN.y + 76}px;text-align:center;font-size:66px;font-weight:700;line-height:1.2;${rise(t, a + 0.15)}">${esc(sub)}${sub2 ? `<br>${esc(sub2)}` : ""}</div>`;
  const x4 = [
    { id: "absent", a: 0, b: n1, kind: "real frame", src: "raw/absent-final.png", take: "It can say not visible", comp: "No ring on the page", motion: "None", disc: "Real call", trans: "Cut to the number", draw: (t) => ({ bg: "#fff", win: free(ABSENT, 1280, 640, 0.94), over: plate(170, `<div style="${rise(t, 0.1)};position:absolute;left:64px;top:38px;font-size:84px;font-weight:800">Not on screen? <span class="hl">It says so.</span></div>`), label: "Real call: not_visible", right: "Synthetic screen", tk: FOLD }) },
    { id: "m-absent", a: n1, b: n2, kind: "evidence", src: ev.sources.negatives, take: "151 of 200, with its failures", comp: "Figure on the point", motion: "Rise", disc: "Failure stated on screen", trans: "Same place", draw: (t) => ({ over: bigNum(t, n1, "Said not visible on absent targets", `${N.absentHits} / ${N.absentPairs}`, `${N.absentMissesHighlighted} of the other ${N.absentPairs - N.absentHits} still got a highlight`), label: "Recorded evaluation" }) },
    { id: "m-hit", a: n2, b: pub, kind: "evidence", src: ev.sources.grounding, take: "89.9% on held-out examples", comp: "Figure on the point", motion: "Rise", disc: "SAM off", trans: "Same place", draw: (t) => ({ over: bigNum(t, n2, "Click point hit the target", `${ev.grounding.percent}%`, `${ev.grounding.hits.toLocaleString("en-US")} of ${ev.grounding.n.toLocaleString("en-US")} held-out examples`), label: "Recorded evaluation", right: "Prompt v3, SAM off" }) },
    { id: "m-public", a: pub, b: 11.8333, kind: "evidence", src: "docs/video/assets/evidence.json", take: "The failures are public", comp: "Two harder results, big", motion: "Rise", disc: "Development tasks", trans: "Hard cut", draw: (t) => ({ over: `<div style="position:absolute;left:0;right:0;top:64px;text-align:center;font-size:72px;font-weight:700;${rise(t, pub - 0.15)}">The failures are public</div>${[[`${ev.pro.percent}%`, "harder professional apps", `${ev.pro.hits} of ${ev.pro.n} examples`, 230], [`${ev.e2e.passed} / ${ev.e2e.n}`, "live-web tasks", "development tasks, not unseen", 510]].map(([num, a1, a2, top]) => `<div style="position:absolute;left:70px;right:40px;top:${top}px;display:flex;align-items:center;gap:60px;${rise(t, pub + 0.1)}"><div style="width:800px;text-align:right;font-size:190px;font-weight:800;color:${SUN}">${num}</div><div style="font-size:60px;font-weight:700;line-height:1.16">${a1}<br><span style="font-size:48px;color:${MIST}">${a2}</span></div></div>`).join("")}`, label: "Recorded evaluation", right: "Prompt v3, SAM off", tk: FOLD }) },
  ];
  const x5 = [{ id: "close", a: 0, b: 3.3334, kind: "editorial plate", src: "billing.png", take: "Back to the opening frame, answered", comp: "Opening layout", motion: "Underline draws", disc: "AI-generated narration", trans: "End", draw: (t) => ({ ...billing(1.55), over: plate(430, `<div style="position:absolute;left:64px;top:30px;font-size:150px;font-weight:800;line-height:1.05">ShowMe</div><div style="position:absolute;left:70px;top:196px;height:13px;background:${SUN};width:${(620 * prog(t, 0, 0.5)).toFixed(1)}px"></div><div style="position:absolute;left:68px;top:232px;font-size:64px;font-weight:700">showme-web-delta.vercel.app</div><div style="position:absolute;left:68px;top:318px;font-size:64px;font-weight:700">github.com/jeevesh2515/showme</div>`), label: SYN, right: "AI-generated narration" }) }];
  return [x0, x1, x2, x3, x4, x5];
}

export function build(key) {
  const durs = timing[key], lists = key === "film" ? filmScenes() : xScenes();
  return lists.map((shots, i) => {
    const dur = durs[i], frames = Math.round(dur * FPS);
    shots.forEach((s, j) => { const next = shots[j + 1]; if (next && Math.abs(s.b - next.a) > 1e-6) throw new Error(`${key} scene ${i}: gap after ${s.id}`); if (s.b <= s.a) throw new Error(`${key} scene ${i}: empty shot ${s.id}`); });
    if (shots[0].a !== 0 || Math.abs(shots.at(-1).b - dur) > 1e-6) throw new Error(`${key} scene ${i}: shots do not fill ${dur}`);
    return { name: key === "film" ? `s${i + 1}` : `x${i}`, dur, frames, shots, frameAt: (n) => { const t = n / FPS, s = shots.find((x) => t < x.b - 1e-9) ?? shots.at(-1); return frameHtml(s.draw(t), key); } };
  });
}

export const shotList = (key) => build(key).flatMap((scene) => scene.shots.map(({ id, a, b, kind, src, take, comp, motion, disc, trans }) => ({ scene: scene.name, id, start: +a.toFixed(3), end: +b.toFixed(3), kind, source: src, takeaway: take, composition: comp, motion, disclosure: disc, transition: trans })));
