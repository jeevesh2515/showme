// Offline presentation assets only. No product/API calls or edits to eval evidence.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const out = join(here, "assets");
const json = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const hash = (p) => createHash("sha256").update(readFileSync(join(root, p))).digest("hex");
const rows = (p) => readFileSync(join(root, p), "utf8").trim().split("\n").map(JSON.parse);
const sources = {
  grounding: "eval/results/2026-11-02-screenspot-v2-heldout-n1172-99e1c829-muse-spark-1.3-minimal-samoff-max2560-pvv3-0707568a",
  pro: "eval/results/2026-11-02-screenspot-pro-heldout-n300-e08c4fce-muse-spark-1.3-minimal-samoff-max2560-pvv3-aa484597",
  negatives: "eval/results/2026-11-02-negatives-heldout-n222-977dad4c-muse-spark-1.3-minimal-samoff-max2560-pvv3-e2f82896",
  dev: "eval/results/2026-11-02-negatives-dev-n100-2d8071a5-muse-spark-1.3-minimal-samoff-max2560-pvv3-9513524e",
  e2e: "eval/results/2026-11-02-e2e-bb543ba-04574992c7",
};
const grounding = json(sources.grounding + "/summary.json");
const pro = json(sources.pro + "/summary.json");
const negatives = json(sources.negatives + "/summary.json");
const e2e = json(sources.e2e + "/results.json");
const probes = rows(sources.negatives + "/predictions.jsonl").filter((r) => r.expected_status === "not_visible");
const absent = probes.filter((r) => r.group !== "synthetic-injection");
const absentHits = absent.filter((r) => r.status === "not_visible").length;
const absentHighlighted = absent.filter((r) => r.status !== "not_visible" && r.box).length;
const pair = (r) => JSON.stringify([r.image_sha256, r.instruction]);
const devPairs = new Set(rows(sources.dev + "/predictions.jsonl").map(pair));
const evidence = {
  prompt: grounding.prompt_version,
  date: grounding.date,
  grounding: { n: grounding.n, hits: grounding.hits, percent: (grounding.accuracy * 100).toFixed(1), uniqueImages: new Set(rows(sources.grounding + "/predictions.jsonl").map((r) => r.image_sha256)).size },
  pro: { n: pro.n, hits: pro.hits, percent: (pro.accuracy * 100).toFixed(1) },
  expectedNotVisible: { ...negatives.by_expected_status.not_visible, percent: (negatives.by_expected_status.not_visible.accuracy * 100).toFixed(1), absentPairs: absent.length, absentHits, absentPercent: (absentHits / absent.length * 100).toFixed(1), absentMissesHighlighted: absentHighlighted, injectionProbes: probes.filter((r) => r.group === "synthetic-injection").length, overlappingPairs: new Set(probes.filter((r) => devPairs.has(pair(r))).map(pair)).size },
  e2e: { n: e2e.tasks.length, passed: e2e.tasks.filter((r) => r.success).length, unseen: false },
  sources,
};
assert.equal(evidence.prompt, "v3");
assert.deepEqual([evidence.grounding.percent, evidence.pro.percent, evidence.expectedNotVisible.percent, evidence.expectedNotVisible.absentPercent, evidence.expectedNotVisible.absentHits, evidence.expectedNotVisible.absentMissesHighlighted, evidence.e2e.passed], ["89.9", "62.0", "76.7", "75.5", 151, 44, 12]);
assert.deepEqual([evidence.grounding.n, evidence.grounding.uniqueImages, evidence.expectedNotVisible.absentPairs, evidence.expectedNotVisible.injectionProbes, evidence.expectedNotVisible.overlappingPairs], [1172, 696, 200, 10, 1]);

const times = [0, 15, 45, 68, 108, 132, 162, 180];
const names = ["Problem", "Privacy review", "Meta models", "Recipient handoff", "Engineering", "Recorded evidence", "Close"];
const speech = readFileSync(join(here, "narration.txt"), "utf8").trim().split(/\n\s*\n/);
assert.equal(speech.length, 7);
const scenes = speech.map((narration, i) => ({ n: i + 1, title: names[i], start: times[i], end: times[i + 1], narration, footageStatus: i < 4 ? "required: genuine product/recipient capture" : "presentation asset ready; founder voice still required" }));
const words = speech.join(" ").split(/\s+/).length;
const trackedSources = [
  ...Object.values(sources).filter((p) => p !== sources.e2e && p !== sources.dev).map((p) => p + "/summary.json"),
  sources.e2e + "/results.json", sources.grounding + "/predictions.jsonl",
  sources.negatives + "/predictions.jsonl", sources.dev + "/predictions.jsonl",
  "apps/web/lib/redaction/redact.ts", "backend/showme/core/sam.py", "docs/video/narration.txt",
];
const sourceHashes = Object.fromEntries(trackedSources.map((p) => [p, hash(p)]));
const probeMedia = (name) => JSON.parse(execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", join(out, name)], { encoding: "utf8" }));

if (process.argv.includes("--check")) {
  const manifest = json("docs/video/assets/manifest.json");
  assert.deepEqual(manifest.sourceHashes, sourceHashes, "source changed: rerender the kit");
  assert.equal(manifest.finalVideoComplete, false);
  for (const [name, seconds] of [["05-code.mp4", 24], ["06-evidence.mp4", 30], ["07-end.mp4", 18]]) {
    const media = probeMedia(name);
    assert.equal(Number(media.format.duration), seconds);
    assert.deepEqual([media.streams[0].width, media.streams[0].height], [1920, 1080]);
  }
  const captions = readFileSync(join(here, "captions.draft.srt"), "utf8");
  assert.equal(captions.includes("NaN"), false);
  assert.equal(readFileSync(join(out, "billing.png")).equals(readFileSync(join(root, "apps/web/public/examples/billing.png"))), true);
  console.log("PASS: source provenance, four metrics, caption file, synthetic fixture, and 24/30/18-second 1080p clips; final film remains pending.");
  process.exit(0);
}

mkdirSync(out, { recursive: true });
writeFileSync(join(here, "scenes.json"), JSON.stringify({ durationSeconds: 180, narrationWords: words, captionTiming: "DRAFT: align to recorded voice before publication", scenes }, null, 2) + "\n");
writeFileSync(join(out, "evidence.json"), JSON.stringify(evidence, null, 2) + "\n");
copyFileSync(join(root, "apps/web/public/examples/billing.png"), join(out, "billing.png"));

// Draft captions preserve every spoken word; their timing is a rehearsal guide, not forced alignment.
const stamp = (ms) => {
  const whole = Math.round(ms);
  return [Math.floor(whole / 3600000), Math.floor(whole / 60000) % 60, Math.floor(whole / 1000) % 60].map((v) => String(v).padStart(2, "0")).join(":") + "," + String(whole % 1000).padStart(3, "0");
};
const wrap = (text, max) => {
  const lines = [""];
  for (const word of text.split(/\s+/)) {
    if (lines.at(-1) && lines.at(-1).length + 1 + word.length > max) lines.push("");
    lines[lines.length - 1] += (lines.at(-1) ? " " : "") + word;
  }
  return lines;
};
const cues = [];
for (const s of scenes) {
  const lines = wrap(s.narration, 38);
  const chunks = [];
  for (let i = 0; i < lines.length; i += 2) chunks.push(lines.slice(i, i + 2).join("\n"));
  const speechMs = Math.min((s.end - s.start - 2) * 1000, s.narration.split(/\s+/).length * 60000 / 125);
  for (let i = 0; i < chunks.length; i++) cues.push({ start: s.start * 1000 + i * speechMs / chunks.length, end: s.start * 1000 + (i + 1) * speechMs / chunks.length - 50, text: chunks[i] });
}
assert.equal(cues.map((c) => c.text).join(" ").replace(/\s+/g, " "), speech.join(" ").replace(/\s+/g, " "));
for (let i = 0; i < cues.length; i++) {
  assert.ok(cues[i].end > cues[i].start && cues[i].end <= 177000);
  assert.ok(!i || cues[i].start >= cues[i - 1].end);
}
writeFileSync(join(here, "captions.draft.srt"), cues.map((c, i) => (i + 1) + "\n" + stamp(c.start) + " --> " + stamp(c.end) + "\n" + c.text).join("\n\n") + "\n");

const { chromium } = createRequire(join(root, "apps/web/package.json"))("@playwright/test");
const font = readFileSync(join(root, "apps/web/fonts/atkinson-hyperlegible-next-latin.woff2")).toString("base64");
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const css = '@font-face{font-family:Atkinson;src:url(data:font/woff2;base64,' + font + ')}*{box-sizing:border-box}html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#fff;color:#16264a;font-family:Atkinson,Arial,sans-serif}.card{width:1920px;height:1080px;padding:66px 96px}h1{font-size:62px;line-height:1.1;margin:0 0 18px;font-weight:800}.mark{width:340px;height:12px;background:#ffd43b;margin-bottom:20px}.sub{font-size:30px;line-height:1.3;margin:0 0 24px}.row{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #e9eef6;padding:18px 0;min-height:126px}.label{font-size:37px;font-weight:700}.meta{font-size:27px;margin-top:5px}.score{font-size:72px;font-weight:800;min-width:310px;text-align:right}.notes{font-size:27px;line-height:1.35;margin-top:25px}.notes p{margin:5px 0}.end{display:flex;flex-direction:column;justify-content:center}.end h1{font-size:144px;margin-bottom:30px}.end p{font-size:54px;margin:16px 0}.code{font:28px/1.35 Menlo,monospace;white-space:pre-wrap;overflow-wrap:anywhere;margin:25px 0 0;padding:26px;background:#e9eef6;border-left:12px solid #ffd43b}.source{font-size:25px;margin-top:24px}.banner{height:128px;width:1728px;padding:28px 35px;background:white;border-left:14px solid #ffd43b;font-size:42px;font-weight:700;line-height:1.5}.transparent{background:transparent}';
const row = (label, meta, score) => '<div class="row"><div><div class="label">' + esc(label) + '</div><div class="meta">' + esc(meta) + '</div></div><div class="score">' + esc(score) + "</div></div>";
const head = (title, sub) => "<h1>" + esc(title) + '</h1><div class="mark"></div><p class="sub">' + esc(sub) + "</p>";
const evidenceCard = head("Recorded evaluations", "Prompt v3 · November 2, 2026 · muse-spark-1.3 minimal")
  + row("ScreenSpot-v2 grounding", "Held-out split · SAM off · 1,172 examples", evidence.grounding.percent + "%")
  + row("ScreenSpot-Pro grounding", "Held-out split · SAM off · 300 examples", evidence.pro.percent + "%")
  + row('Says “not visible” on absent targets', "151 / 200 probes · 44 of the other 49 still got a highlight", evidence.expectedNotVisible.absentPercent + "%")
  + row("Live-web development tasks", "Not an unseen task set", evidence.e2e.passed + " / " + evidence.e2e.n)
  + '<div class="notes"><p>Grounding: 1,172 examples across 696 unique images.</p><p>Injection probes counted apart: 10 / 10. One dev/reporting pair overlap.</p><p>Honesty is not independent held-out validation. Sources: accompanying evidence.json.</p></div>';
const redact = readFileSync(join(root, "apps/web/lib/redaction/redact.ts"), "utf8").split("\n");
const a = redact.findIndex((l) => l.includes("ctx.drawImage(bitmap"));
const b = redact.findIndex((l, i) => i > a && l.includes("const encoded = encodeCanvas"));
assert.ok(a >= 0 && b > a);
const redactExcerpt = redact.slice(a, b).join("\n") + "\n\n" + redact.find((l) => l.includes("return { dataUrl: encoded.dataUrl"));
const sam = readFileSync(join(root, "backend/showme/core/sam.py"), "utf8").split("\n");
const c = sam.findIndex((l) => l.includes("contains = sam_box"));
const d = sam.findIndex((l, i) => i >= c && l.includes("return _box_result(latency_ms)"));
assert.ok(c >= 0 && d > c);
const codeCard = (title, sub, code, source) => head(title, sub) + '<pre class="code">' + esc(code) + '</pre><p class="source">' + esc(source) + "</p>";
const cards = [
  ["evidence-card.png", evidenceCard, "card"],
  ["end-card.png", '<h1>ShowMe</h1><div class="mark"></div><p>showme-web-delta.vercel.app</p><p>github.com/jeevesh2515/showme</p>', "card end"],
  ["redaction-code.png", codeCard("Review becomes a new image", "Actual source excerpts · browser masking and typed output", redactExcerpt, "apps/web/lib/redaction/redact.ts · excerpts, not a runtime privacy proof"), "card"],
  ["sam-gate-code.png", codeCard("Refinement must pass the gate", "Bounding-box overlap · point containment · area limit", sam.slice(c, d + 1).join("\n"), "backend/showme/core/sam.py · refinement never moves the click point"), "card"],
];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  await page.route("http**/*", (r) => r.abort());
  for (const [name, content, klass] of cards) {
    await page.setContent("<!doctype html><meta charset=utf-8><style>" + css + '</style><main class="' + klass + '">' + content + "</main>");
    await page.evaluate(() => document.fonts.ready);
    const fits = await page.locator("main").evaluate((el) => el.scrollHeight <= el.clientHeight && el.scrollWidth <= el.clientWidth && [...el.querySelectorAll("h1,p,pre,.row")].every((n) => n.getBoundingClientRect().bottom <= 1050 && n.scrollWidth <= n.clientWidth + 1));
    assert.ok(fits, name + " has clipped content");
    await page.screenshot({ path: join(out, name) });
    console.log("rendered " + name);
  }
  await page.setViewportSize({ width: 1728, height: 128 });
  await page.setContent("<!doctype html><style>" + css + 'html,body{width:1728px;height:128px;background:transparent}</style><div class="banner">Illustrative scenario · synthetic billing screen</div>');
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, "opening-label.png"), omitBackground: true });
} finally {
  await browser.close();
}
const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...args], { timeout: 120000 });
const encoding = ["-an", "-r", "30", "-c:v", "libx264", "-preset", "ultrafast", "-tune", "stillimage", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart"];
ff(["-loop", "1", "-t", "12", "-i", join(out, "redaction-code.png"), "-loop", "1", "-t", "12", "-i", join(out, "sam-gate-code.png"), "-filter_complex", "[0:v][1:v]concat=n=2:v=1:a=0[v]", "-map", "[v]", "-t", "24", ...encoding, join(out, "05-code.mp4")]);
console.log("rendered 05-code.mp4 (24 seconds, silent)");
for (const [image, name, seconds] of [["evidence-card.png", "06-evidence.mp4", 30], ["end-card.png", "07-end.mp4", 18]]) {
  ff(["-loop", "1", "-i", join(out, image), "-t", String(seconds), ...encoding, join(out, name)]);
  console.log("rendered " + name + " (" + seconds + " seconds, silent)");
}
writeFileSync(join(out, "manifest.json"), JSON.stringify({ format: "1920x1080 / 30 fps", totalTimelineSeconds: 180, generatedPresentationSeconds: 72, missingGenuineFootageSeconds: 108, narrationWords: words, captionTiming: "draft; not aligned to actual speech", finalVideoComplete: false, sourceHashes, clips: ["05-code.mp4", "06-evidence.mp4", "07-end.mp4"] }, null, 2) + "\n");
console.log("Kit assets ready. No genuine product/recipient footage or voice has been fabricated.");
