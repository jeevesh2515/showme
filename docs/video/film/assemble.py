"""Build a candid 180-second review cut from recorded frames; no API calls.

Run python3 docs/video/film/assemble.py. Founder audio and physical-phone
footage remain explicit final-publication gates; this command makes a preview.
"""
from pathlib import Path
import hashlib
import json
import re
import subprocess

HERE = Path(__file__).resolve().parent
VIDEO = HERE.parent
OUT = VIDEO / 'out'
TAKE = OUT / 'take-v2'
EDIT = TAKE / 'edit'
RAW = TAKE / 'raw'
FF = '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg'

# Refuse a changed take rather than reuse a stale encoded-source cache.
for relative, expected in json.loads((TAKE / 'source-hashes.json').read_text()).items():
    path = RAW / relative
    if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
        raise ValueError(f'Frozen capture changed: {relative}; select and verify a new take.')
EDIT.mkdir(parents=True, exist_ok=True)

def run(args):
    subprocess.run(args, check=True)

def ff(args):
    run([FF, '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)])

def probe(path):
    return json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)]))

def duration(path):
    return float(probe(path)['format']['duration'])

ENC = ['-an', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']
# Preserve the screencast's real timestamps, including static-screen waits.
for name in ['main', 'phone']:
    dest = EDIT / f'{name}-source.mp4'
    if not dest.exists() or dest.stat().st_size < 1000:
        data = json.loads((RAW / name / 'timeline.json').read_text())
        frames = data['frames']
        end = max(data['marks'][-1]['t'], frames[-1]['t'])
        lines = ['ffconcat version 1.0']
        for i, frame in enumerate(frames):
            path = RAW / name / f"f{frame['n']:06d}.jpg"
            next_t = frames[i + 1]['t'] if i + 1 < len(frames) else end
            lines += [f"file '{path}'", f"duration {max(.001, next_t - frame['t']):.6f}"]
        lines += [f"file '{path}'"]
        listing = EDIT / f'{name}.ffconcat'
        listing.write_text('\n'.join(lines) + '\n')
        ff(['-f', 'concat', '-safe', '0', '-i', listing, '-vf', 'fps=30,pad=ceil(iw/2)*2:ceil(ih/2)*2', *ENC, dest])
        print('Conformed original timestamps:', name, flush=True)

main = json.loads((RAW / 'main/timeline.json').read_text())
t0 = main['frames'][0]['t']
marks = {m['id']: m['t'] - t0 for m in main['marks']}
# Product UI is scaled as a whole; no highlight is moved, replaced or redrawn.
frame = 'scale=1600:900:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:72:color=white,setsar=1'

def still(source, seconds, dest, framing=frame):
    ff(['-loop', '1', '-i', source, '-vf', framing, '-t', seconds, *ENC, dest])

def clip(source, start, stop, seconds, dest, real_speed=False):
    factor = 1 if real_speed else seconds / (stop - start)
    ff(['-i', source, '-vf', f'trim=start={start}:end={stop},setpts=(PTS-STARTPTS)*{factor},{frame},fps=30,tpad=stop_mode=clone:stop_duration={seconds}', '-t', seconds, *ENC, dest])

def concat(parts, dest):
    listing = dest.with_suffix('.txt')
    listing.write_text(''.join(f"file '{p}'\n" for p in parts))
    ff(['-f', 'concat', '-safe', '0', '-i', listing, '-c', 'copy', dest])

still(TAKE / 'billing.png', 9, EDIT / 'opening-a.mp4')
# Genuine result preview from the original take; the accepted SAM outline remains untouched.
ff(['-ss', marks['refined'] + 1, '-i', EDIT / 'main-source.mp4', '-frames:v', '1', EDIT / 'result.png'])
still(EDIT / 'result.png', 6, EDIT / 'opening-b.mp4')
concat([EDIT / 'opening-a.mp4', EDIT / 'opening-b.mp4'], EDIT / '01.mp4')
clip(EDIT / 'main-source.mp4', 0, marks['looking'], 30, EDIT / '02.mp4')
clip(EDIT / 'main-source.mp4', marks['looking'], marks['share'], 23, EDIT / '03.mp4', real_speed=True)
clip(EDIT / 'main-source.mp4', marks['share'], duration(EDIT / 'main-source.mp4'), 16, EDIT / 'sharing.mp4')
clip(EDIT / 'phone-source.mp4', 0, duration(EDIT / 'phone-source.mp4'), 24, EDIT / 'mobile-preview.mp4')
concat([EDIT / 'sharing.mp4', EDIT / 'mobile-preview.mp4'], EDIT / '04.mp4')
# Cards retain their original readable sizing, with a caption area below the notes.
for i, asset in [(5, '05-code.mp4'), (6, '06-evidence.mp4'), (7, '07-end.mp4')]:
    ff(['-i', VIDEO / 'assets' / asset, '-c', 'copy', EDIT / f'{i:02d}.mp4'])
concat([EDIT / f'{i:02d}.mp4' for i in range(1, 8)], EDIT / 'picture.mp4')
print('Picture edit assembled', flush=True)

scenes = json.loads((HERE / 'review-scenes.json').read_text())['scenes']
assert (HERE / 'review-narration.txt').read_text().strip() == '\n\n'.join(s['narration'] for s in scenes)
# Local macOS system voice is an overt rehearsal guide, never impersonates founder.
spoken = {
    '89.9': 'eighty nine point nine', '1,172': 'one thousand one hundred and seventy two',
    '151': 'one hundred and fifty one', '200': 'two hundred', '75.5': 'seventy five point five',
}
for s in scenes:
    i, seconds = s['n'], s['end'] - s['start']
    text = s['narration']
    for a, b in spoken.items():
        text = text.replace(a, b)
    speechfile = EDIT / f'voice-{i:02d}.txt'
    speechfile.write_text(text)
    aiff = EDIT / f'scratch-{i:02d}.aiff'
    run(['say', '-v', 'Daniel', '-r', '152', '-f', str(speechfile), '-o', str(aiff)])
    d = duration(aiff)
    if d > seconds - .8:
        raise ValueError(f'Speech {i} needs {d:.2f}s, exceeds scene {seconds}s. Revise text, do not silently speed it up.')
    s['scratchSpeechSeconds'] = d
    ff(['-i', aiff, '-af', f'adelay=400:all=1,apad,atrim=0:{seconds}', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', EDIT / f'audio-{i:02d}.wav'])
concat([EDIT / f'audio-{i:02d}.wav' for i in range(1, 8)], EDIT / 'scratch.wav')

# ASS captions sit below product controls and below evidence-card footnotes.
# Draft cue timing follows speech word weights; founder recordings require real alignment.
def stamp(t):
    h, rem = divmod(t, 3600)
    m, sec = divmod(rem, 60)
    return f'{int(h)}:{int(m):02d}:{sec:05.2f}'

def escape(s):
    return s.replace('\\', '').replace('{', '(').replace('}', ')').replace('\n', r'\N')

ass = '''[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes
[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Caption,Arial,38,&H00FFFFFF,&H00FFFFFF,&H004A2616,&H004A2616,0,0,0,0,100,100,0,0,3,6,0,2,110,110,30,1
Style: Status,Arial,24,&H004A2616,&H004A2616,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,5,0,8,30,30,10,1
Style: Chapter,Arial,30,&H004A2616,&H004A2616,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,5,0,1,36,36,136,1
Style: Note,Arial,30,&H004A2616,&H004A2616,&H003BD4FF,&H003BD4FF,-1,0,0,0,100,100,0,0,3,8,0,8,30,30,46,1
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
'''
events = []
def event(start, end, style, text):
    events.append(f'Dialogue: 0,{stamp(start)},{stamp(end)},{style},,0,0,0,,{escape(text)}')

event(0, 180, 'Status', 'REVIEW CUT · system rehearsal voice · draft captions · physical iPhone footage pending')
notes = [
    (0, 9, 'Illustrative scenario · synthetic billing screen'),
    (9, 15, 'Actual recorded result · accepted SAM outline'),
    (15, 45, 'Partial detection · manual corrections before upload · playback slowed'),
    (45, 68, 'muse-spark-1.3 + sam-3.1 · accepted outline · recorded wait; result held'),
    (68, 84, 'Second review → consent → create link · playback slowed'),
    (84, 108, 'MOBILE BROWSER EMULATION · replace with actual iPhone recording'),
    (108, 132, 'Actual source excerpts · browser masking and SAM agreement gate'),
]
for a, b, note in notes:
    event(a, b, 'Note', note)
# Full-time selection disclosure while displaying any selected product capture.
event(9, 108, 'Chapter', 'Selected recorded take; earlier attempts logged')
cues = []
for s in scenes:
    words = s['narration'].split()
    chunks, current = [], []
    for word in words:
        current.append(word)
        if len(' '.join(current)) >= 67 or (len(current) >= 7 and re.search(r'[.!?]”?$', word)):
            chunks.append(' '.join(current)); current = []
    if current:
        chunks.append(' '.join(current))
    elapsed = 0
    for chunk in chunks:
        weight = len(chunk.split()) / len(words)
        start = s['start'] + .4 + elapsed
        end = start + s['scratchSpeechSeconds'] * weight
        event(start, end - .04, 'Caption', chunk)
        cues.append({'start': start, 'end': end - .04, 'text': chunk})
        elapsed += s['scratchSpeechSeconds'] * weight
ass += '\n'.join(events) + '\n'
assfile = EDIT / 'preview.ass'
assfile.write_text(ass)
def srt_time(t):
    ms = round(t * 1000)
    return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
(OUT / 'showme-review-captions.srt').write_text('\n\n'.join(f"{i+1}\n{srt_time(c['start'])} --> {srt_time(c['end'])}\n{c['text']}" for i, c in enumerate(cues)) + '\n')
ff(['-i', EDIT / 'picture.mp4', '-i', EDIT / 'scratch.wav', '-vf', f'ass={assfile}', '-map', '0:v:0', '-map', '1:a:0', '-t', '180', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', OUT / 'showme-review-cut.mp4'])
result = probe(OUT / 'showme-review-cut.mp4')
v = next(x for x in result['streams'] if x['codec_type'] == 'video')
a = next(x for x in result['streams'] if x['codec_type'] == 'audio')
assert (v['width'], v['height'], v['r_frame_rate']) == (1920, 1080, '30/1')
assert abs(float(result['format']['duration']) - 180) < .05
assert a['codec_name'] == 'aac' and a['sample_rate'] == '48000'
# Hash the raw capture set once for reproducible provenance; exclude deletion key.
sources = list((RAW / 'main').glob('*.jpg')) + list((RAW / 'phone').glob('*.jpg'))
sources += [TAKE / 'billing.png']
sources += [RAW / x for x in ['main/timeline.json', 'phone/timeline.json', 'main-step-response.json', 'main-refine-response.json', 'uploaded.jpg']]
aggregate = hashlib.sha256()
for path in sorted(sources):
    aggregate.update(path.relative_to(VIDEO).as_posix().encode())
    aggregate.update(hashlib.sha256(path.read_bytes()).digest())
manifest = {
    'status': 'REVIEW CUT: founder audio and physical-iPhone footage pending',
    'finalVideoComplete': False, 'durationSeconds': duration(OUT / 'showme-review-cut.mp4'),
    'format': '1920x1080 H.264 30fps + AAC stereo 48kHz',
    'newModelCalls': 0, 'newModelCostUsd': 0,
    'assetHashes': {str(p.relative_to(VIDEO)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [VIDEO / 'assets/evidence-card.png', VIDEO / 'assets/evidence.json', VIDEO / 'assets/05-code.mp4', VIDEO / 'assets/06-evidence.mp4', VIDEO / 'assets/07-end.mp4', HERE / 'review-scenes.json']},
    'rawCaptureFilesHashed': len(sources), 'rawCaptureAggregateSha256': aggregate.hexdigest(),
    'narrationSha256': hashlib.sha256((HERE / 'review-narration.txt').read_bytes()).hexdigest(),
    'selectedTake': 'frozen out/take-v2/raw/main; selected after earlier attempts, including a misplaced box; exact count unresolved',
    'timing': 'Original screencast timestamps conformed to 30fps; scenes slowed or held for narration; no waits shortened',
    'productOverlayModified': False, 'samResult': 'accepted outline', 'earlierFailure': 'Earlier take placed box below intended button; disclosed in take notes',
    'mobileFootage': 'Chromium emulation, explicitly labelled, replace before final',
    'audio': 'macOS Daniel system voice, explicitly labelled rehearsal',
    'captions': 'draft word-weight timing; real voice alignment pending',
    'scenes': scenes,
}
(OUT / 'edit-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
print('PASS: review cut 180s, 1080p30, H.264/AAC; final-publication gates remain.', flush=True)
