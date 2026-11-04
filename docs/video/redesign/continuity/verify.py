# Independent checks of the final exports, read from the decoded media rather than from the builder's own claims.
# Run from the repo root: uv run -q --with numpy --with scipy --with pillow python -I docs/video/redesign/verify.py <tag>
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from scipy import ndimage as ndi

ROOT = Path.cwd()
OUT = ROOT / "docs/video/out"
TAG = sys.argv[1]
LOCKED = TAG.startswith("locked")
INK = TAG.startswith("ink")
SEG = json.loads((OUT / "voice/higgsfield/segments-fixed-point.json").read_text())["segments"]
APPROVED = json.loads((OUT / "voice/higgsfield/segments.json").read_text())["segments"]
TIMING = json.loads((ROOT / "docs/video/redesign/timing.json").read_text())
FILES = {"film": OUT / f"ShowMe-3min-hackathon-candidate-{TAG}.mp4", "x": OUT / f"ShowMe-X-launch-candidate-{TAG}.mp4"}
EXPECT = {"film": (180.0, 5400), "x": (44.6, 1338)}
PHONE_SHA = "3cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068"
P = (48 + 482, 40 + 632) if LOCKED else (482 * 1.5, (632 - 60) * 1.5) if INK else (960, 720)
report, failures = {"tag": TAG, "cuts": {}}, []


def check(ok, message):
    if not ok:
        failures.append(message)
    return bool(ok)


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def probe(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-count_frames", "-show_entries", "stream=codec_name,codec_type,width,height,r_frame_rate,sample_rate,nb_read_frames,pix_fmt:format=duration", "-of", "json", str(path)], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def frames(path, start, count, h=1080):
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(start), "-i", str(path), "-frames:v", str(count), "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, h, 1920, 3)


def srt(path):
    def sec(s):
        h, m, r = s.split(":")
        a, b = r.split(",")
        return int(h) * 3600 + int(m) * 60 + int(a) + int(b) / 1000
    rows = []
    for block in path.read_text().strip().split("\n\n"):
        lines = block.split("\n")
        a, b = lines[1].split(" --> ")
        rows.append((sec(a), sec(b), " ".join(lines[2:])))
    return rows


def clean(s):
    return re.sub(r"\s+", " ", s).strip()


def ring_center(fr, key="film"):
    r, g, b = fr[..., 0].astype(int), fr[..., 1].astype(int), fr[..., 2].astype(int)
    mask = (r > 215) & (g > 170) & (g < 235) & (b < 120)
    if LOCKED:
        bx = (24, 1496, 24, 875) if key == "x" else (48, 1328, 40, 780)
        mask[:bx[2]] = mask[bx[3]:] = False
        mask[:, :bx[0]] = mask[:, bx[1]:] = False
    else:
        mask[:64] = mask[928:] = False
        mask[:, :40] = mask[:, 1880:] = False
    lab, _ = ndi.label(mask)
    best = None
    for i, sl in enumerate(ndi.find_objects(lab), 1):
        hh, ww = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if ww < 80 or hh < 25 or not 1.8 < ww / hh < 8 or (lab[sl] == i).sum() / (ww * hh) > 0.75:
            continue
        if best is None or ww > best[2]:
            best = (sl[1].start + ww / 2, sl[0].start + hh / 2, ww)
    return best


for key, path in FILES.items():
    r = {"file": str(path.relative_to(ROOT)), "sha256": sha(path), "bytes": path.stat().st_size}
    p = probe(path)
    v = next(s for s in p["streams"] if s["codec_type"] == "video")
    a = next(s for s in p["streams"] if s["codec_type"] == "audio")
    dur, nframes = EXPECT[key]
    r["probe"] = {"duration": float(p["format"]["duration"]), "frames": int(v["nb_read_frames"]), "video": f"{v['codec_name']} {v['width']}x{v['height']} {v['r_frame_rate']} {v['pix_fmt']}", "audio": f"{a['codec_name']} {a['sample_rate']}"}
    check(abs(float(p["format"]["duration"]) - dur) < 0.001, f"{key}: duration {p['format']['duration']}")
    check(int(v["nb_read_frames"]) == nframes, f"{key}: frames {v['nb_read_frames']}")
    check(v["codec_name"] == "h264" and v["width"] == 1920 and v["height"] == 1080 and v["r_frame_rate"] == "30/1", f"{key}: video format")
    check(a["codec_name"] == "aac" and a["sample_rate"] == "48000", f"{key}: audio format")

    err = subprocess.run(["ffmpeg", "-hide_banner", "-v", "error", "-i", str(path), "-f", "null", "-"], capture_output=True, text=True).stderr
    r["fullDecodeErrors"] = len(err.strip().splitlines())
    check(not err.strip(), f"{key}: decode errors")

    # Scene frame budgets, from the provenance shot records the builder measured.
    prov = json.loads(Path(f"{path}.provenance.json").read_text())
    budget = [round(d * 30) for d in TIMING[key]]
    names = [f"s{i + 1}" if key == "film" else f"x{i}" for i in range(len(budget))]
    actual = {Path(s["file"]).stem: s["frames"] for s in prov["shots"]}
    r["sceneFrames"] = [actual[n] for n in names]
    check(r["sceneFrames"] == budget, f"{key}: scene frames {r['sceneFrames']} != {budget}")
    r["narrationDisclosure"] = prov["narration"]
    check(prov["narration"] == "AI-generated narration", f"{key}: narration disclosure")

    # Transcript: exact approved words, in order.
    paragraphs = (ROOT / ("docs/video/narration.txt" if key == "film" else "docs/video/x-narration.txt")).read_text().strip().split("\n\n")
    cues = srt(Path(f"{path}.srt"))
    r["captionCues"] = len(cues)
    check(clean(" ".join(c[2] for c in cues)) == clean(" ".join(paragraphs)), f"{key}: caption words differ from approved")

    # Cue times against the timing manifest.
    starts, t = [], 0.0
    for i, d in enumerate(TIMING[key]):
        s = SEG[f"{key}-{i}"]
        for c in s["cues"]:
            starts.append((t + s["offset"] + c["start"], t + s["offset"] + c["end"]))
        t += d
    r["maxCueManifestDiffSeconds"] = round(max(abs(a0 - b0) + abs(a1 - b1) for (a0, a1, _), (b0, b1) in zip(cues, starts)), 4)
    check(len(starts) == len(cues) and r["maxCueManifestDiffSeconds"] < 0.003, f"{key}: cue manifest mismatch")

    # Burned caption boundaries read from the decoded picture: the caption band changes exactly at cue times.
    ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vf", ("crop=1824:80:48:984,format=gray,scale=450:24" if key == "x" else "crop=1800:64:60:996,format=gray,scale=450:24") if INK else ("crop=1872:62:24:958,format=gray,scale=450:24" if key == "x" else "crop=1280:118:48:866,format=gray,scale=450:24") if LOCKED else "crop=1800:96:60:950,format=gray,scale=450:24", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    band = np.frombuffer(ff.stdout.read(), np.uint8).reshape(-1, 24, 450)
    ff.wait()
    change = np.abs(np.diff(band.astype(int), axis=0)).mean(axis=(1, 2))
    edges = (np.nonzero(change > 0.4)[0] + 1) / 30
    worst = 0.0
    for a0, a1, _ in cues:
        for edge in (a0,):
            if edges.size:
                worst = max(worst, float(np.min(np.abs(edges - edge))))
    r["maxBurnedCueStartDiffSeconds"] = round(worst, 4)
    check(worst <= 0.1, f"{key}: burned caption start differs by {worst}")

    # Audio: every approved segment sits at its planned time, with no lag.
    pcm = lambda f: np.frombuffer(subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(f), "-ac", "1", "-ar", "8000", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
    mix = pcm(path)
    # v5 carries the same approved speech at known slots, so it is the reference for "this speech is unchanged".
    v5 = pcm(OUT / {"film": "ShowMe-3min-hackathon-candidate-phone-motion-20261104-v5.mp4", "x": "ShowMe-X-launch-candidate-phone-motion-20261104-v5.mp4"}[key])
    v5_slots = {"film": [18.3, 28, 31.7, 34, 21, 34, 13], "x": [7.4, 8.4, 8.2, 5.6, 11.82, 3.18]}[key]
    timing, t = [], 0.0
    for i, d in enumerate(TIMING[key]):
        s = SEG[f"{key}-{i}"]
        wav = OUT / "voice/higgsfield" / s["file"]
        check(sha(wav) == sha(OUT / "voice/higgsfield" / APPROVED[f"{key}-{i}"]["file"]), f"{key}-{i}: wav differs")
        src = np.frombuffer(subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(wav), "-ac", "1", "-ar", "8000", "-f", "f32le", "-"], capture_output=True, check=True).stdout, np.float32)
        at = int((t + s["offset"]) * 8000)
        best, lag = -2.0, None
        for shift in range(-800, 801, 2):
            a0 = max(at + shift, 0)
            seg = mix[a0:a0 + len(src)]
            n = min(len(seg), len(src))
            if n < 800:
                continue
            c = float(np.corrcoef(seg[:n], src[:n])[0, 1])
            if c > best:
                best, lag = c, shift / 8
        old_at = int((sum(v5_slots[:i]) + 0.15) * 8000)
        # Whole-millisecond adelay rounding can shift a segment by under 1 ms, so compare at the best small lag.
        against_v5 = -2.0
        for shift in range(-8, 9):
            now, then = mix[at + 8:at + len(src) - 8], v5[old_at + 8 + shift:old_at + len(src) - 8 + shift]
            n = min(len(now), len(then))
            against_v5 = max(against_v5, float(np.corrcoef(now[:n], then[:n])[0, 1]))
        timing.append({"segment": f"{key}-{i}", "plannedStart": round(t + s["offset"], 3), "lagMs": lag, "correlationWithSource8k": round(best, 4), "correlationWithV5Speech": round(against_v5, 4), "file": s["file"], "tailSeconds": round(d - s["offset"] - s["duration"], 3)})
        check(abs(lag) <= 1, f"{key}-{i}: lag {lag}")
        check(against_v5 > 0.98, f"{key}-{i}: speech differs from v5 at {against_v5}")
        check(d - s["offset"] - s["duration"] >= -0.001, f"{key}-{i}: speech overruns")
        t += d
    r["audio"] = timing

    # Registration: the recorded ring must sit on the fixed point in the final picture.
    probes = {"film": [(4.5, "hook, recorded result"), (18.3 + 25 + 19, "desktop box"), (18.3 + 25 + 21, "desktop outline")], "x": [(4.4, "hook"), (15.8 + 3, "desktop box"), (15.8 + 6.5, "outline")]}[key] if INK else {"film": [(5.5, "hook, recorded result"), (61.8, "desktop box"), (66.3, "desktop outline")], "x": [(5.5, "hook"), (20.2, "desktop box"), (22.6, "outline")]}[key] if LOCKED else {"film": [(4.5, "hook, pinched guide"), (18.3 + 25 + 18.5, "desktop box"), (18.3 + 25 + 23, "desktop outline"), (77.5 + 16.5, "phone pinch")], "x": [(4.4, "hook"), (15.8 + 4, "desktop box"), (15.8 + 6.5, "outline"), (23.85 + 3.8, "pinch")]}[key]
    reg = []
    want = (24 + 482 * 1.15, 24 + 632 * 1.15) if LOCKED and key == "x" else P
    for at, name in probes:
        expected = ((304 + 482 * .881 - 220) * .82, (226 + 632 * .881 - 150) * .82) if "continuity" in TAG and "hook" in name else want
        c = ring_center(frames(path, at, 1)[0], key)
        reg.append({"at": at, "shot": name, "ring": None if c is None else [round(c[0], 1), round(c[1], 1)], "widthPx": None if c is None else c[2]})
        check(c is not None and abs(c[0] - expected[0]) < 14 and abs(c[1] - expected[1]) < 14, f"{key}: ring off the point at {at}: {c}")
    r["registration"] = reg
    if INK:
        # Every declared phone window must avoid the reviewed exclusions.
        windows = [(s["id"], a0, b0) for s in prov["shotList"] for a0, b0 in s.get("phone", [])]
        r["phoneWindows"] = windows
        for name, a0, b0 in windows:
            check(a0 >= 6.2 and b0 <= 29.6 and not (a0 < 26.2 and b0 > 24.2), f"{key}: phone window {name} {a0}-{b0}")
    # Full-picture jumps: frames where most of the sheet changes at once. Dissolves are gradual and do not count.
    ff = subprocess.Popen(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path), "-vf", "scale=96:54,format=gray", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    small = np.frombuffer(ff.stdout.read(), np.uint8).reshape(-1, 54, 96).astype(int)
    ff.wait()
    d = np.abs(np.diff(small, axis=0))
    # A true cut changes the picture in one frame; a dissolve spreads the same change across neighbouring frames.
    level = (d > 24).mean(axis=(1, 2))
    jumps = np.array([i for i in range(1, len(level) - 1) if level[i] > 0.12 and level[i - 1] < 0.04 and level[i + 1] < 0.04], dtype=int)
    r["hardCuts"] = {"count": int(jumps.size), "at": [round((int(i) + 1) / 30, 2) for i in jumps][:60]}
    r["meanFrameChange"] = round(float(d.mean()), 3)
    report["cuts"][key] = r

# The guide token must not be readable anywhere in the link shots.
token_hits = {}
for key, times in {"film": [82.5 + i * 0.5 for i in range(5)], "x": [23.9 + i * 0.4 for i in range(5)]}.items():
    for at in times:
        raw = subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(at), "-i", str(FILES[key]), "-frames:v", "1", "-f", "image2pipe", "-c:v", "png", "-"], capture_output=True, check=True).stdout
        text = subprocess.run(["tesseract", "stdin", "stdout", "--psm", "6"], input=raw, capture_output=True).stdout.decode(errors="ignore")
        token_hits[f"{key}@{at}"] = {"sawUrlHost": "showme-web-delta" in text, "sawToken": bool(re.search(r"Vhz|WaK|PusAh|SBhV", text))}
        check(not token_hits[f"{key}@{at}"]["sawToken"], f"{key}: guide token readable at {at}")
report["tokenOcr"] = token_hits

# Sources and preservation.
report["phoneSourceSha256"] = sha(OUT / "raw/recipient.mov")
check(report["phoneSourceSha256"] == PHONE_SHA, "phone source sha")
check(sha(ROOT / "docs/video/incoming/phone-20261104/recipient-original.mov") == PHONE_SHA, "incoming phone sha")
verification = json.loads((OUT / "phone-motion-20261104-v5-verification.json").read_text())
preserved = dict(verification.get("preservedExports", {}))
for o in verification["outputs"]:
    preserved[str(Path(o["file"]).relative_to(ROOT))] = o["sha256"]
bad = [k for k, v in preserved.items() if sha(ROOT / k) != v]
report["preservedExportsChecked"] = len(preserved)
report["preservedExportsChanged"] = bad
check(not bad, f"preserved exports changed: {bad}")

# This revision also preserves every pre-existing ShowMe output, including other agents' alternatives.
prior = json.loads((OUT / f"{TAG}-before.json").read_text())
changed = [k for k, v in prior.items() if sha(ROOT / k) != v]
report["allPriorOutputsChecked"] = len(prior)
report["allPriorOutputsChanged"] = changed
check(not changed, f"prior outputs changed: {changed}")

# Published numbers against the generated artifacts, not the film's own copy.
ev = json.loads((ROOT / "docs/video/assets/evidence.json").read_text())
d = {k: ROOT / v for k, v in ev["sources"].items()}
g, pro = [json.loads((d[k] / "summary.json").read_text()) for k in ("grounding", "pro")]
neg = json.loads((d["negatives"] / "summary.json").read_text())
neg_report, e2e_report = (d["negatives"] / "report.md").read_text(), (d["e2e"] / "report.md").read_text()
n_ok, n_unsure = neg["by_status"]["ok"]["n"], neg["by_status"]["unsure"]["n"]
report["evidence"] = {"groundingHits": [g["hits"], g["n"], g["prompt_version"]], "proHits": [pro["hits"], pro["n"], pro["prompt_version"]], "groundingP50Ms": g["latency_p50_ms"], "groundingCostPerCall": round(g["total_cost_usd"] / g["n"], 5), "absentLine": next(l for l in neg_report.splitlines() if "Absent-target pairs" in l), "highlightedAbsent": n_ok + n_unsure, "e2eLine": next(l for l in e2e_report.splitlines() if "Success rate" in l)}
check([g["hits"], g["n"]] == [1054, 1172], "grounding figure")
check([pro["hits"], pro["n"]] == [186, 300], "pro figure")
check("151/200" in neg_report, "absent figure")
check(n_ok + n_unsure == 44, "44 highlighted figure")
check("12/20" in e2e_report, "e2e figure")
check(2750 <= g["latency_p50_ms"] <= 2850 and g["total_cost_usd"] / g["n"] < 0.01, "2.8 s and under a cent")
report["failures"] = failures
target = OUT / f"{TAG}-verification.json"
target.write_text(json.dumps(report, indent=1) + "\n")
print(json.dumps({"failures": failures, "file": str(target)}, indent=1))
sys.exit(1 if failures else 0)
