// Edits the recorded takes into the 3:00 hackathon film and the X cut. Offline: no model or network calls.
// Usage: node build.mjs [film|x|all] [--check]. Replacement audio requires an aligned provenance manifest.
// Real phone footage: out/raw/recipient.mov replaces the phone-size browser recording.
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { candidatePaths, narrationDisclosure, planNarration } from "./audio-plan.mjs";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "../../..");
const OUT = join(here, "../out"), RAW = join(OUT, "raw");
const FPS = 30;
const TAKE = process.env.TAKE?.trim() || "selected recorded take; ordinal not verified";
const which = process.argv[2] ?? "all";
if (!["film", "x", "all"].includes(which)) throw new Error("Choose film, x or all; --check performs preflight only");
const FILM_SCENES = [
  { dur: 18.3 }, { dur: 28, at: { 3: 12.6, 4: 21.2 } }, { dur: 31.7, at: { 2: 16.5 } }, { dur: 34, at: { 2: 15 }, capRight: [8, 20] },
  { dur: 21, at: { 3: 11.2 } }, { dur: 34, at: { 1: 8.2 } }, { dur: 13, at: { 0: 0.8 } },
];
const X_SCENES = [{ dur: 7.4 }, { dur: 8.4 }, { dur: 8.2 }, { dur: 5.6, capRight: [0, 5.6] }, { dur: 11.82 }, { dur: 3.18 }];
const seconds = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]));
const manifestFile = process.env.VOICE_MANIFEST ? resolve(process.env.VOICE_MANIFEST) : join(OUT, "voice/higgsfield/segments.json");
const voiceManifest = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, "utf8")) : null;
if (process.env.VOICE_MANIFEST && !voiceManifest) throw new Error(`Audio manifest not found: ${manifestFile}`);
const legacyIndex = JSON.parse(readFileSync(join(OUT, "voice/index.json"), "utf8"));
const plans = {};
for (const key of which === "all" ? ["film", "x"] : [which]) {
  const paragraphs = readFileSync(join(here, key === "film" ? "../narration.txt" : "../x-narration.txt"), "utf8").trim().split(/\n\s*\n/);
  if (!voiceManifest && paragraphs.some((_, i) => existsSync(join(OUT, `voice/founder/${key}-${i}.wav`)))) {
    throw new Error(`${key}: genuine recordings need an aligned VOICE_MANIFEST with explicit founder provenance; folder presence is insufficient`);
  }
  plans[key] = planNarration({ key, paragraphs, scenes: key === "film" ? FILM_SCENES : X_SCENES, manifest: voiceManifest, manifestDir: dirname(manifestFile), root, out: OUT, duration: seconds, legacyIndex });
}
if (process.argv.includes("--check")) {
  console.log(JSON.stringify(Object.fromEntries(Object.entries(plans).map(([key, plan]) => [key, { seconds: plan.total, disclosure: narrationDisclosure(plan), captionTiming: plan.captionTiming, segments: plan.segments }])), null, 2));
  process.exit(0);
}
const tag = process.env.CANDIDATE_TAG || `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const candidates = candidatePaths(OUT, tag, existsSync, which === "all" ? ["film", "x"] : [which]);
// A unique workspace preserves every previous export, shot, and alternative edit.
const runDir = mkdtempSync(join(OUT, `candidate-${tag}-`));
const SHOTS = join(runDir, "shots"), TMP = join(runDir, "tmp");
for (const d of [SHOTS, TMP]) mkdirSync(d, { recursive: true });
const { chromium } = createRequire(join(root, "apps/web/package.json"))("@playwright/test");
const CUT_WAIT = process.env.CUT_WAIT === "1"; // for a take whose looking screen was blank: jump to the result and label it
const json = (p) => JSON.parse(readFileSync(p, "utf8"));
const ff = (...a) => {
  try { execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...a], { maxBuffer: 1 << 26, stdio: ["ignore", "ignore", "pipe"] }); }
  catch (e) { throw new Error(`ffmpeg failed: ${String(e.stderr).slice(0, 600)}`); }
};
const ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-r", String(FPS), "-an"];
const b64 = (p) => readFileSync(p).toString("base64");
const png = (p) => `data:image/png;base64,${b64(p)}`;
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;");

const step = json(join(RAW, "main-step-response.json"));
const sam = json(join(RAW, "main-refine-response.json"));
const ev = json(join(here, "../assets/evidence.json"));
const realPhone = existsSync(join(RAW, "recipient.mov"));
const uploaded = `data:image/webp;base64,${b64(join(RAW, "uploaded.jpg"))}`;
const original = png(join(root, "apps/web/public/examples/billing.png"));

const font = b64(join(root, "apps/web/fonts/atkinson-hyperlegible-next-latin.woff2"));
const CSS = `@font-face{font-family:A;src:url(data:font/woff2;base64,${font});font-weight:200 800}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:transparent;color:#16264a;font-family:A,Arial,sans-serif}
.card{position:absolute;inset:0;background:#fff;padding:90px 110px}.sun{background:#fff4c2}.ink{background:#16264a;color:#fff}.mark{width:300px;height:12px;background:#ffd43b;margin:18px 0 30px}
h1{font-size:76px;line-height:1.08;margin:0;font-weight:800}p{margin:0}.sub{font-size:36px;line-height:1.3}
.pill{position:absolute;left:44px;top:40px;background:#fff;border-left:10px solid #ffd43b;padding:14px 24px;font-size:30px;font-weight:700;box-shadow:0 4px 18px rgba(22,38,74,.22);border-radius:6px}
.src{position:absolute;left:110px;bottom:150px;font-size:25px;color:#42506e}
@keyframes up{from{opacity:0;transform:translateY(26px)}to{opacity:1;transform:none}}@keyframes pop{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}@keyframes in{from{opacity:0}to{opacity:1}}
.a{animation:up .5s cubic-bezier(.2,.8,.2,1) both}.b{animation:pop .45s cubic-bezier(.2,.9,.2,1.05) both}.f{animation:in .45s both}
.mono{font:31px/1.5 Menlo,monospace}.row{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e9eef6;padding:13px 0;min-height:112px}.rl{font-size:36px;font-weight:700}.rm{font-size:25px;margin-top:4px;color:#42506e}.rs{font-size:68px;font-weight:800}
.cap{position:absolute;left:50%;transform:translateX(-50%);bottom:42px;width:max-content;max-width:1640px;background:rgba(22,38,74,.94);color:#fff;font-size:40px;line-height:1.26;font-weight:600;padding:13px 30px;border-radius:12px;text-align:center}`;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const setHtml = async (html) => { await page.setContent(`<!doctype html><meta charset=utf-8><style>${CSS}</style>${html}`); await page.evaluate(() => document.fonts.ready); };
const stamp = (name, html) => setHtml(html).then(() => page.evaluate(() => document.getAnimations().forEach((a) => a.finish()))).then(() => { const f = join(TMP, `${name}.png`); return page.screenshot({ path: f, omitBackground: true }).then(() => f); });

// Animated card: every animation frame is rendered and checked by seeking, then the last frame holds.
async function card(name, html, dur, anim = 1.6) {
  await setHtml(html);
  const dir = join(TMP, name); mkdirSync(dir, { recursive: true });
  const n = Math.round(anim * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), (i / FPS) * 1000);
    await page.screenshot({ path: join(dir, `${String(i).padStart(4, "0")}.jpg`), type: "jpeg", quality: 96 });
  }
  const out = join(SHOTS, `${name}.mp4`);
  ff("-framerate", String(FPS), "-i", join(dir, "%04d.jpg"), "-vf", `tpad=stop_mode=clone:stop_duration=${Math.max(0, dur - anim)}`, "-t", String(dur), ...ENC, out);
  return out;
}

// Raw takes become constant-frame-rate video once; frame times come from the capture timeline.
const rawMemo = {};
function raw(session) {
  if (rawMemo[session]) return rawMemo[session];
  const dir = join(RAW, session), t = json(join(dir, "timeline.json"));
  const list = t.frames.map((f, i) => `file '${join(dir, `f${String(f.n).padStart(6, "0")}.jpg`)}'\nduration ${Math.max(0.001, (t.frames[i + 1]?.t ?? f.t + 2) - f.t).toFixed(4)}`).join("\n");
  const lf = join(TMP, `raw-${session}-frames.txt`); writeFileSync(lf, `${list}\n`);
  const out = join(TMP, `raw-${session}.mp4`);
  ff("-f", "concat", "-safe", "0", "-i", lf, "-vf", `fps=${FPS},crop=trunc(iw/2)*2:trunc(ih/2)*2`, "-c:v", "libx264", "-preset", "fast", "-crf", "12", "-pix_fmt", "yuv420p", out);
  const t0 = t.frames[0].t;
  const marks = Object.fromEntries(t.marks.map((m) => [m.id, m.t - t0]));
  return (rawMemo[session] = { file: out, marks });
}

const ease = (a, b, t0, t1) => { const u = `((t-${t0})/${t1 - t0})`; return `(${a}+(${b - a})*${u}*${u}*(3-2*${u}))`; };
const piece = (kf, prop) => {
  let e = String(kf.at(-1)[prop]);
  for (let i = kf.length - 2; i >= 0; i--) e = `if(lt(t,${kf[i].t}),${kf[i][prop]},if(lt(t,${kf[i + 1].t}),${ease(kf[i][prop], kf[i + 1][prop], kf[i].t, kf[i + 1].t)},${e}))`;
  return e;
};
// Clip with a smooth pan and zoom. kf rects are in 2560-wide source pixels; overlays are full-frame PNGs.
function clip(name, session, from, to, kf, { hold = 0, overlays = [] } = {}) {
  const r = raw(session), dur = to - from + hold;
  // Supersampled zoompan: per-frame scale plus crop keeps a stale input size in ffmpeg 8 and mis-pans.
  const keys = kf.map((k) => ({ t: k.t, z: 2560 / k.w, x: k.x * 2, y: k.y * 2 }));
  const T = (e) => e.replaceAll("t-", `(on/${FPS})-`).replaceAll("lt(t,", `lt((on/${FPS}),`);
  const z = T(piece(keys, "z")), x = T(piece(keys, "x")), y = T(piece(keys, "y"));
  let fc = `[0:v]trim=start=${from}:end=${to},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${hold},scale=5120:2880:flags=lanczos,zoompan=z='${z}':x='${x}':y='${y}':d=1:s=1920x1080:fps=${FPS},setsar=1[v]`;
  const inputs = ["-i", r.file];
  let last = "v";
  overlays.forEach((o, i) => {
    inputs.push("-loop", "1", "-t", String(dur), "-i", o.png);
    const a = o.from ?? 0, b = o.to ?? dur;
    fc += `;[${i + 1}:v]format=rgba,fade=t=in:st=${a}:d=0.3:alpha=1,fade=t=out:st=${b - 0.3}:d=0.3:alpha=1[o${i}];[${last}][o${i}]overlay=0:0:shortest=1[m${i}]`;
    last = `m${i}`;
  });
  const out = join(SHOTS, `${name}.mp4`);
  ff(...inputs, "-filter_complex", fc, "-map", `[${last}]`, "-t", String(dur), ...ENC, out);
  return out;
}
const FULL = { x: 0, y: 0, w: 2560 };
const at = (t, r) => ({ t, ...r });
const pill = (name, text) => stamp(name, `<div class="pill">${esc(text)}</div>`);

function phoneShot(name, dur, bgPng, from = 0) {
  const out = join(SHOTS, `${name}.mp4`);
  const src = realPhone ? join(RAW, "recipient.mov") : raw("phone").file;
  const hole = { x: 300, y: 92, w: 462, h: 894 };
  ff("-loop", "1", "-t", String(dur), "-i", bgPng, "-i", src, "-filter_complex", `[1:v]trim=start=${from},setpts=PTS-STARTPTS,tpad=stop_mode=clone:stop_duration=${dur},scale=${hole.w}:${hole.h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${hole.w}:${hole.h}:0:0[p];[0:v][p]overlay=${hole.x}:${hole.y}:shortest=1[v]`, "-map", "[v]", "-t", String(dur), ...ENC, out);
  return out;
}

// The recipient's highlight enlarged from the same phone recording, so it reads at feed size.
function phoneZoom(name, dur) {
  const out = join(SHOTS, `${name}.mp4`);
  const n = Math.round(dur * FPS);
  ff("-ss", String(raw("phone").marks.ring + 2), "-i", raw("phone").file, "-frames:v", "1", "-update", "1", join(TMP, `${name}.png`));
  ff("-loop", "1", "-t", String(dur), "-i", join(TMP, `${name}.png`), "-vf", `crop=1178:663:0:300,scale=3840:2160:flags=lanczos,zoompan=z='1+0.1*on/${n}':x='iw*0.1*(on/${n})*0.32':y='ih*0.1*(on/${n})*0.74':d=1:s=1920x1080:fps=${FPS},setsar=1`, "-t", String(dur), ...ENC, out);
  return out;
}

const box = step.target.box, sb = sam.box, pt = step.target.point;
const inter = sb ? Math.max(0, Math.min(box.x2, sb.x2) - Math.max(box.x1, sb.x1)) * Math.max(0, Math.min(box.y2, sb.y2) - Math.max(box.y1, sb.y1)) : 0;
const areaOf = (b) => (b.x2 - b.x1) * (b.y2 - b.y1);
const iou = sb ? inter / (areaOf(box) + areaOf(sb) - inter) : 0;
const W = 1280, H = 740;
const gateRow = (ok, label, value) => `<div style="display:flex;justify-content:space-between;gap:30px;font-size:30px;padding:10px 0;border-bottom:1px solid #e9eef6"><span>${ok ? "✓" : "✗"} ${esc(label)}</span><b>${esc(value)}</b></div>`;
const gatePanel = `<div class="f" style="position:absolute;right:60px;top:80px;width:690px;background:#fff;border-left:12px solid #ffd43b;padding:26px 32px;border-radius:8px;box-shadow:0 8px 30px rgba(22,38,74,.28)"><div style="font-size:36px;font-weight:800">sam-3.1 agreement gate</div><div style="font-size:24px;margin:4px 0 14px;color:#42506e">Values from this take. Outline ${sam.mode === "outline" ? "kept" : "rejected, box kept"}.</div>
${gateRow(iou >= 0.5, "Box overlap (IoU ≥ 0.5)", iou.toFixed(2))}${gateRow(!!sb && sb.x1 <= pt.x && pt.x <= sb.x2 && sb.y1 <= pt.y && pt.y <= sb.y2, "Contains Spark's point", `${pt.x}, ${pt.y}`)}${gateRow(!!sb && areaOf(sb) <= 0.25 * W * H, "Area ≤ 25% of image", sb ? `${((areaOf(sb) / (W * H)) * 100).toFixed(1)}%` : "n/a")}</div>`;

async function assets() {
  const A = {};
  A.synth = await pill("p-synth", "Illustrative scenario · synthetic billing screen");
  A.live = await pill("p-live", `Live product · real model output · ${TAKE}`);
  A.spark = await pill("p-spark", CUT_WAIT ? `muse-spark-1.3 · this call ${(step.timings_ms.ground / 1000).toFixed(1)} s, wait trimmed · median 2.8 s` : "muse-spark-1.3 · real call, real time");
  A.gate = await stamp("p-gate", gatePanel);
  A.share = await pill("p-share", "Second review, consent, then the link");
  A.absent = await pill("p-absent", "Real call, goal “Download my 2019 tax invoice” · status: not_visible, action: scroll");
  A.title = await stamp("p-title", `<div class="f" style="position:absolute;left:0;right:0;bottom:190px;text-align:center"><span style="background:#fff;padding:18px 44px;border-radius:14px;font-size:64px;font-weight:800;box-shadow:0 8px 30px rgba(22,38,74,.3)">ShowMe: one clear next step</span></div>`);
  A.phoneBg = await (async () => { await setHtml(`<div class="card" style="background:#e9eef6;padding:0"><div style="position:absolute;left:284px;top:76px;width:494px;height:926px;background:#111827;border-radius:64px"></div><div style="position:absolute;left:860px;top:70px;width:940px"><div style="font-size:30px;font-weight:700;margin-bottom:18px">The original example</div><img src="${original}" style="width:900px;border-radius:12px;box-shadow:0 8px 30px rgba(22,38,74,.2)"><div style="margin-top:28px;font-size:44px;font-weight:800;line-height:1.15">A picture, not remote control.</div><div class="sub" style="margin-top:12px;font-size:30px">${realPhone ? "Provided recipient recording · device and consent verification pending." : "Recipient view: phone-size browser, not a physical iPhone."}</div></div></div>`); const f = join(TMP, "phonebg.png"); await page.screenshot({ path: f }); return f; })();
  return A;
}
const bubbleHtml = `<div class="card sun"><div class="b" style="animation-delay:.1s;position:absolute;left:380px;top:90px;width:900px;background:#fff;border-radius:28px;padding:20px;box-shadow:0 10px 40px rgba(22,38,74,.16)"><img src="${original}" style="width:100%;border-radius:14px"></div><div class="b" style="animation-delay:.7s;position:absolute;left:380px;top:690px;background:#16264a;color:#fff;border-radius:26px;padding:22px 42px;font-size:60px;font-weight:800">“Where do I press?”</div><p class="sub a" style="animation-delay:1.1s;position:absolute;left:380px;top:825px;font-size:34px">On a call, neither of you can see what the other means.</p></div>`;
const statHtml = `<div class="card ink" style="padding-top:210px"><div class="b" style="font-size:240px;font-weight:800;color:#ffd43b;line-height:1">65%</div><p class="sub a" style="animation-delay:.5s;font-size:46px;margin-top:30px;max-width:1450px">of older internet users surveyed got tech help from family at least sometimes.</p><p class="f" style="animation-delay:.9s;font-size:25px;margin-top:40px;opacity:.85">Journal of Applied Gerontology, 2025, n=1,173.</p></div>`;
const uploadHtml = `<div class="card" style="padding:70px 80px"><h1 class="a" style="font-size:58px">The exact image that left the browser</h1><div class="mark a"></div><div style="display:flex;gap:40px"><div class="a" style="animation-delay:.2s;width:860px"><div style="font-size:30px;font-weight:700;margin-bottom:12px">On this device</div><img src="${original}" style="width:100%;border:2px solid #e9eef6;border-radius:10px"></div><div class="a" style="animation-delay:.6s;width:860px"><div style="font-size:30px;font-weight:700;margin-bottom:12px">Captured from POST /v1/step in this take</div><img src="${uploaded}" style="width:100%;border:2px solid #e9eef6;border-radius:10px"></div></div></div>`;
const jsonHtml = `<div class="card" style="padding:80px 110px"><h1 class="a" style="font-size:60px">Muse Spark's actual reply</h1><div class="mark a"></div><pre class="mono a" style="animation-delay:.3s;margin:0;background:#e9eef6;border-left:12px solid #ffd43b;padding:30px 36px">${esc(['{', `  "status": "${step.status}",`, `  "action": "${step.action}",`, `  "instruction": "${step.instruction}",`, `  "target": {`, `    "label": "${step.target.label}",`, `    "point": ${JSON.stringify(step.target.point)},`, `    "box": ${JSON.stringify(step.target.box)}`, `  },`, `  "model": "${step.model}",`, `  "ground_ms": ${step.timings_ms.ground},`, `  "cost_usd": ${step.cost_usd}`, '}'].join("\n"))}</pre></div>`;
const row = (l, m, s, d) => `<div class="row a" style="animation-delay:${d}s"><div><div class="rl">${esc(l)}</div><div class="rm">${esc(m)}</div></div><div class="rs">${esc(s)}</div></div>`;
const n = ev.expectedNotVisible;
const evidenceHtml = `<div class="card" style="padding:56px 110px"><h1 class="a" style="font-size:60px">Recorded evaluations</h1><div class="mark a" style="margin:12px 0 10px"></div><p class="a" style="font-size:26px;color:#42506e;margin-bottom:6px">Prompt v3 · November 2, 2026 · muse-spark-1.3 minimal · SAM off</p>
${row("ScreenSpot-v2 grounding", `Held-out split · ${ev.grounding.hits} of 1,172 examples`, `${ev.grounding.percent}%`, 0.2)}${row("ScreenSpot-Pro grounding", `Held-out split · ${ev.pro.hits} of ${ev.pro.n} examples`, `${ev.pro.percent}%`, 0.5)}${row("Says “not visible” on absent targets", `${n.absentHits} of ${n.absentPairs} probes · ${n.absentMissesHighlighted} of the other ${n.absentPairs - n.absentHits} still got a highlight`, `${n.absentPercent}%`, 0.8)}${row("Live-web development tasks", "Not an unseen task set", `${ev.e2e.passed} / ${ev.e2e.n}`, 1.1)}
<p class="f" style="animation-delay:1.4s;font-size:27px;line-height:1.35;margin-top:14px;color:#42506e">Injection probes counted apart: 10 of 10. One image pair overlaps dev and reporting. Footage: ${TAKE}. Earlier attempts included a low box before the example was cropped.</p></div>`;
const endHtml = (voiceKey) => `<div class="card" style="display:flex;flex-direction:column;justify-content:center"><div class="b" style="font-size:150px;font-weight:800">ShowMe</div><div class="mark a" style="animation-delay:.2s"></div><p class="a" style="animation-delay:.3s;font-size:52px">showme-web-delta.vercel.app</p><p class="a" style="animation-delay:.45s;font-size:52px;margin-top:10px">github.com/jeevesh2515/showme</p><p class="f" style="animation-delay:.7s;font-size:27px;margin-top:40px;color:#42506e">Built solo during the Meta Global AI Developer Hackathon · Indie Track · Build for Your World<br>${esc(narrationDisclosure(plans[voiceKey]))}</p></div>`;

const concat = (files, out) => { const l = join(TMP, `${Date.now()}-c.txt`); writeFileSync(l, files.map((f) => `file '${f}'`).join("\n")); ff("-f", "concat", "-safe", "0", "-i", l, "-c", "copy", out); };
// Captions: every spoken word, two lines at most, drawn as one transparent track.
async function captionTrack(name, cues, total, cls = "") {
  const blank = await stamp(`${name}-blank`, "");
  const lines = [];
  let t = 0, i = 0;
  for (const c of cues) {
    if (c.start > t) { lines.push(`file '${blank}'\nduration ${(c.start - t).toFixed(3)}`); t = c.start; }
    const f = await stamp(`${name}-c${i++}`, `<div class="cap" style="${cls}${c.style ?? ""}">${esc(c.text).replace("\n", "<br>")}</div>`);
    const end = c.end;
    lines.push(`file '${f}'\nduration ${(end - t).toFixed(3)}`);
    t = end;
  }
  lines.push(`file '${blank}'\nduration ${Math.max(0.1, total - t).toFixed(3)}`, `file '${blank}'`);
  const l = join(TMP, `${name}-cues.txt`); writeFileSync(l, lines.join("\n"));
  const out = join(TMP, `${name}-cap.mov`);
  ff("-f", "concat", "-safe", "0", "-i", l, "-vf", `fps=${FPS},format=argb`, "-c:v", "qtrle", out);
  return out;
}
const chunk = (text, max) => {
  const out = []; let cur = "";
  for (const w of text.split(/\s+/)) { if (cur && (cur + " " + w).length > max) { out.push(cur); cur = w; } else cur = cur ? `${cur} ${w}` : w; }
  if (cur) out.push(cur);
  if (out.length > 1 && !out.at(-1).includes(" ")) { const prev = out[out.length - 2].split(" "); out[out.length - 1] = `${prev.pop()} ${out.at(-1)}`; out[out.length - 2] = prev.join(" "); } // no one-word widow
  const pairs = [];
  for (let i = 0; i < out.length; i += 2) pairs.push(out.slice(i, i + 2).join("\n"));
  return pairs;
};

async function finish(name, shots, scenes, voiceKey, outFile) {
  const silent = join(TMP, `${name}-silent.mp4`);
  concat(shots, silent);
  const total = scenes.reduce((a, s) => a + s.dur, 0);
  const plan = plans[voiceKey];
  const inputs = plan.clips.flatMap((c) => ["-i", c.file]);
  const delays = plan.clips.map((c) => c.start);
  // Replacement cues already follow measured speech timing; never re-proportion them.
  const cues = plan.cues.flatMap((c) => {
    const scene = scenes[c.scene], sceneStart = scenes.slice(0, c.scene).reduce((n, s) => n + s.dur, 0);
    const right = !!scene.capRight && c.start - sceneStart >= scene.capRight[0] && c.start - sceneStart < scene.capRight[1];
    const parts = chunk(c.text, right ? 40 : scene.capWidth ?? 52);
    const style = right ? "left:1330px;max-width:1050px" : "";
    if (voiceManifest) {
      if (parts.length > 1) throw new Error(`Aligned caption too long in ${voiceKey}-${c.scene}; provide shorter measured cues instead of estimating word times`);
      return [{ ...c, text: parts[0], style }];
    }
    // Legacy system-voice chunks remain explicitly draft; replacement audio never uses these estimates.
    return parts.map((text, i) => ({ ...c, start: c.start + (i * (c.end - c.start)) / parts.length, end: c.start + ((i + 1) * (c.end - c.start)) / parts.length, text, style }));
  });
  const cap = await captionTrack(name, cues, total);
  const aud = inputs.filter((x) => x !== "-i").map((_, i) => `[${i}:a]aresample=48000,aformat=channel_layouts=mono,adelay=${Math.round(delays[i] * 1000)}:all=1[a${i}]`).join(";");
  const mix = `${aud};${delays.map((_, i) => `[a${i}]`).join("")}amix=inputs=${delays.length}:normalize=0:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,apad[aout]`;
  const wav = join(TMP, `${name}.wav`);
  ff(...inputs, "-filter_complex", mix, "-map", "[aout]", "-t", String(total), wav);
  ff("-i", silent, "-i", cap, "-i", wav, "-filter_complex", "[0:v]tpad=stop_mode=clone:stop_duration=0.5[b];[b][1:v]overlay=0:0,format=yuv420p[v]", "-map", "[v]", "-map", "2:a", "-t", String(total), "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-profile:v", "high", "-r", String(FPS), "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", outFile);
  writeFileSync(`${outFile}.srt`, cues.map((c, i) => { const f = (s) => { const ms = Math.round(s * 1000); return [ms / 3600000, (ms / 60000) % 60, (ms / 1000) % 60].map((v) => String(Math.floor(v)).padStart(2, "0")).join(":") + "," + String(ms % 1000).padStart(3, "0"); }; return `${i + 1}\n${f(c.start)} --> ${f(c.end)}\n${c.text}`; }).join("\n\n") + "\n");
  const exported = seconds(outFile);
  if (Math.abs(exported - total) > 0.001) throw new Error(`${name}: exported duration ${exported} differs from ${total}`);
  writeFileSync(`${outFile}.provenance.json`, JSON.stringify({ candidate: true, final: false, durationSeconds: exported, takeDisclosure: TAKE, trimmedWaits: CUT_WAIT, narration: narrationDisclosure(plan), captionTiming: plan.captionTiming, segments: plan.segments, replacementManifest: voiceManifest ? manifestFile : null, recipient: realPhone ? "Provided recording at out/raw/recipient.mov; consent and real-device verification still required" : "Labelled mobile-browser emulation; actual iPhone/recipient recording missing" }, null, 2) + "\n");
  console.log(`${outFile}: ${exported.toFixed(3)} s`);
}

const m = raw("main").marks;
// Source rectangles (2560-wide) measured from the take.
const REVIEW = { x: 480, y: 540, w: 1600 }; // brush off, before any scroll
const NAME = { x: 400, y: 590, w: 1000 }; // brush on: toolbar wraps and the image drops
const LOWER = { x: 430, y: 680, w: 1200 }; // expiry and address lines
const AFTER = { x: 480, y: 400, w: 1700 }; // all masks in view
const STEP = { x: 120, y: 120, w: 2320 };
const RING = { x: 317, y: 481, w: 1180 };

async function film() {
  const A = await assets();
  const o = (png, from, to) => ({ png, from, to });
  const s = [];
  s.push(await card("s1a", bubbleHtml + `<div class="pill">Illustrative scenario · synthetic billing screen</div>`, 4, 1.4));
  s.push(await card("s1c", statHtml, 10.8, 1.4));
  s.push(clip("s1d", "main", m.refined + 0.4, m.refined + 2.4, [at(0, STEP), at(2, RING)], { hold: 1.5, overlays: [o(A.title, 0.2, 3.5)] }));
  s.push(clip("s2a", "main", m.app, m.brush - 0.2, [at(0, FULL), at(4, FULL), at(6, REVIEW)], { hold: 5, overlays: [o(A.synth, 0, 12)] }));
  s.push(clip("s2b", "main", m.brush - 0.2, m.continue + 0.3, [at(0, REVIEW), at(1.4, NAME), at(3.8, NAME), at(5.2, LOWER), at(7.4, LOWER), at(8.6, AFTER)]));
  s.push(await card("s2c", uploadHtml, 28 - (m.brush - 0.2 - m.app) - 5 - (m.continue + 0.3 - (m.brush - 0.2)), 1.4));
  const s3from = CUT_WAIT ? m.step - 0.2 : m.continue + 0.3, s3move = m.step - s3from;
  s.push(clip("s3a", "main", s3from, m.refined + 0.6, [at(0, CUT_WAIT ? STEP : FULL), at(Math.max(0.1, s3move - 0.6), CUT_WAIT ? STEP : FULL), at(s3move + 0.8, STEP)], { overlays: [o(A.spark, 0, 99)], hold: CUT_WAIT ? 3.2 : 1 }));
  const s3a = seconds(s.at(-1));
  s.push(await card("s3b", jsonHtml, 9.5, 1.1));
  s.push(clip("s3c", "main", m.refined + 1, m.refined + 3.5, [at(0, STEP), at(2.2, RING)], { hold: 31.7 - s3a - 9.5 - 2.5, overlays: [o(A.gate, 1.6, 99)] }));
  s.push(clip("s4a", "main", m.end - 8, m.end, [at(0, { x: 500, y: 300, w: 1560 })], { overlays: [o(A.share, 0, 99)] }));
  s.push(phoneShot("s4b", 12, A.phoneBg));
  s.push(realPhone ? phoneShot("s4c", 14, A.phoneBg, 12) : phoneZoom("s4c", 14));
  const code = (nm, f, d) => card(nm, `<img src="${png(join(here, "../assets", f))}" style="position:absolute;left:0;top:0;width:1920px">`, d, 0.2);
  s.push(await code("s5a", "redaction-code.png", 12));
  s.push(await code("s5b", "sam-gate-code.png", 9));
  const ab = raw("absent").marks;
  s.push(clip("s6a", "absent", ab.result - 0.4, ab.result + 3, [at(0, STEP)], { hold: 0.8, overlays: [o(A.absent, 0, 99)] }));
  s.push(await card("s6b", evidenceHtml, 29.8, 1.9));
  s.push(await card("s7", endHtml("film"), 13, 1.3));
  await finish("film", s, FILM_SCENES, "film", candidates.film);
}

async function x() {
  const A = await assets();
  const o = (png, from, to) => ({ png, from, to });
  const s = [];
  s.push(await card("x0", bubbleHtml + `<div class="pill">Illustrative scenario · synthetic billing screen</div>`, 7.4, 1.2));
  s.push(clip("x1", "main", m.review + 0.3, m.review + 8.7, [at(0, REVIEW), at(1.4, NAME), at(5, NAME), at(6.6, LOWER)]));
  s.push(clip("x2", "main", m.refined - 1, m.refined + 3, [at(0, STEP), at(2.4, RING)], { hold: 4.2, overlays: [o(A.gate, 3, 99)] }));
  s.push(phoneShot("x3", 5.6, A.phoneBg, realPhone ? 0 : raw("phone").marks.ring + 1.2));
  s.push(await card("x4", evidenceHtml, 11.82, 1.9));
  s.push(await card("x5", endHtml("x"), 3.18, 1.3));
  await finish("x", s, X_SCENES, "x", candidates.x);
}

try {
  if (which === "film" || which === "all") await film();
  if (which === "x" || which === "all") await x();
} finally {
  await browser.close();
}
