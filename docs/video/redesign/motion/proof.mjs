// 12-second proof: hook, signature device, real product payoff. Uses approved audio only; output never replaces a candidate.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderRanges } from "./render.mjs";

const here = dirname(fileURLToPath(import.meta.url)), OUT = resolve(here, "../../out");
const manifest = JSON.parse(readFileSync(join(OUT, "voice/higgsfield/segments-fixed-point.json"), "utf8")).segments;
const ranges = [["film", 0, 0, 5.6], ["film", 2, 29.6, 32.1], ["film", 3, 15.2, 19.2]];
const dir = join(OUT, "fixed-point-proof"), silent = join(dir, "proof-silent.mp4"), final = process.argv[2];
mkdirSync(dir, { recursive: true });
const cue = ([key, i, n]) => { const seg = manifest[`${key}-${i}`], t = n / 30 - seg.offset; return seg.cues.find((c) => t >= c.start && t < c.end)?.text ?? ""; };
await renderRanges(ranges, silent, cue);
let at = 0, parts = [], inputs = [];
for (const [key, i, a, b] of ranges) {
  const seg = manifest[`${key}-${i}`];
  inputs.push("-i", join(OUT, "voice/higgsfield", seg.file));
  const j = inputs.length / 2;
  parts.push(`[${j}:a]aresample=48000,aformat=channel_layouts=mono,atrim=${Math.max(0, a - seg.offset)}:${b - seg.offset},asetpts=PTS-STARTPTS,adelay=${Math.round((at + Math.max(0, seg.offset - a)) * 1000)}:all=1[a${j}]`);
  at += b - a;
}
const mix = `${parts.join(";")};${parts.map((_, k) => `[a${k + 1}]`).join("")}amix=inputs=${parts.length}:normalize=0,apad[o]`;
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", silent, ...inputs, "-filter_complex", mix, "-map", "0:v", "-map", "[o]", "-t", String(at), "-c:v", "libx264", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", final]);
console.log(final, at);
