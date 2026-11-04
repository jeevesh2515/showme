# Writes the fixed-point timing manifest: same approved audio files, phrase-level cues from measured word times,
# and edit-specific segment offsets. The approved segments.json and every WAV stay read-only.
# Run from the repo root: python3 -I docs/video/redesign/recue.py
import importlib.util
import json
from pathlib import Path

ROOT = Path.cwd()
BASE = ROOT / "docs/video/out/voice/higgsfield"
HERE = ROOT / "docs/video/redesign"
FILM = ROOT / "docs/video/film"

spec = importlib.util.spec_from_file_location("align", FILM / "align-higgsfield.py")
align = importlib.util.module_from_spec(spec)
spec.loader.exec_module(align)

timing = json.loads((HERE / "timing.json").read_text())
source = json.loads((BASE / "segments.json").read_text())
papers = {"film": FILM / "../narration.txt", "x": FILM / "../x-narration.txt"}
aligned = {}
for key, path in papers.items():
    paragraphs = [p for p in path.read_text().strip().split("\n\n")]
    whisper = json.loads(Path(source["segments"][f"{key}-0"]["alignment"]).read_text())
    aligned[key] = align.align_words(paragraphs, whisper)

breaks, current = {}, None
for line in (HERE / "cue-breaks.txt").read_text().splitlines():
    if line.startswith("["):
        current = line.strip("[]")
        breaks[current] = []
    elif line.strip():
        breaks[current].append(line.strip())

words_out, manifest = {}, {"version": 1, "derivedFrom": "segments.json", "segments": {}}
for sid, seg in source["segments"].items():
    key, i = sid.split("-")
    words = aligned[key][int(i)]
    cuts = seg["pause_edits"]
    start = seg["source_start"]
    remap = lambda t: max(0.0, align.remap_time(t, start, cuts))
    flat = [{**w, "start": remap(w["start"]), "end": remap(w["end"])} for w in words]
    cues, cursor = [], 0
    for phrase in breaks[sid]:
        n = len(phrase.split())
        group = flat[cursor:cursor + n]
        if " ".join(w["text"] for w in group) != phrase:
            raise SystemExit(f"{sid}: break does not match approved words: {phrase!r}")
        cues.append({"start": round(group[0]["start"], 3), "end": round(group[-1]["end"], 3), "text": phrase})
        cursor += n
    if cursor != len(flat):
        raise SystemExit(f"{sid}: {len(flat) - cursor} approved words not captioned")
    for a, b in zip(cues, cues[1:]):
        # Whisper tokens can overlap by a few ms; a gap under 0.35 s reads as flicker, so hold the earlier cue.
        if b["start"] - a["end"] < 0.35:
            a["end"] = b["start"] = round(max(a["end"], b["start"]) if b["start"] < a["end"] else b["start"], 3)
    cues[-1]["end"] = round(min(cues[-1]["end"], seg["duration"]), 3)
    offset = timing["offsets"].get(sid, 0.15)
    manifest["segments"][sid] = {**seg, "offset": offset, "cues": cues}
    words_out[sid] = {"offset": offset, "duration": seg["duration"], "words": [{"text": w["text"], "start": round(w["start"], 3), "end": round(w["end"], 3)} for w in flat]}

(BASE / "segments-fixed-point.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=1) + "\n")
(HERE / "motion/words.json").write_text(json.dumps(words_out, ensure_ascii=False, indent=0) + "\n")
for key in ("film", "x"):
    durs = timing[key]
    t = 0
    rows = []
    for i, d in enumerate(durs):
        seg = manifest["segments"][f"{key}-{i}"]
        end = seg["offset"] + seg["duration"]
        if end > d + 1e-3:
            raise SystemExit(f"{key}-{i}: speech {end:.3f} overruns scene {d}")
        rows.append((round(t, 3), d, round(seg["offset"], 3), round(d - end, 3)))
        t += d
    print(key, "total", round(t, 3), "start/dur/offset/tail", rows)
