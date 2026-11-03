"""Align approved ShowMe narration to local Whisper token times, then split locally.

No generation/network/installation. Raw Higgsfield files are never modified.
Run --help. Mismatches and overruns write a review report and stop before clips.
"""
from __future__ import annotations

import argparse
from decimal import Decimal
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
VIDEO = HERE.parent
BASE = VIDEO / 'out/voice/higgsfield'
MODEL = Path('/Users/jeeveshsingale/.cache/hyperframes/whisper/models/ggml-small.en.bin')
DURATIONS = {'film': [18.3, 28, 31.7, 34, 21, 34, 13], 'x': [7.4, 8.4, 8.2, 5.6, 11.82, 3.18]}
LEX = re.compile(r"\d+(?:,\d{3})*(?:\.\d+)?|[A-Za-z]+(?:['’][A-Za-z]+)?|%")
ONES = dict(zip('zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(), range(20)))
TENS = dict(zip('twenty thirty forty fifty sixty seventy eighty ninety'.split(), range(20, 100, 10)))
SCALES = {'thousand': 1000, 'million': 1000000, 'billion': 1000000000}


class AlignmentError(ValueError):
    pass


class OverrunError(AlignmentError):
    def __init__(self, overruns):
        self.overruns = overruns
        super().__init__('Speech overruns require review: ' + ', '.join(f"scene {x['scene'] + 1}: +{x['overrun_seconds']:.3f}s" for x in overruns))


def _integer(atoms, i):
    """Conservative English-cardinal parser; no fuzzy numeric substitutions."""
    if atoms[i]['text'][0].isdigit():
        return atoms[i]['text'].replace(',', ''), i + 1
    total = current = 0
    j, previous = i, ''
    while j < len(atoms):
        word = atoms[j]['text'].lower()
        if word in ONES:
            if previous in ONES and previous != 'zero':
                break
            if previous in TENS and ONES[word] >= 10:
                break
            current += ONES[word]
        elif word in TENS:
            if previous in ONES or previous in TENS:
                break
            current += TENS[word]
        elif word == 'hundred' and 0 < current < 10:
            current *= 100
        elif word in SCALES and current:
            total += current * SCALES[word]
            current = 0
        elif word == 'and' and j + 1 < len(atoms) and atoms[j + 1]['text'].lower() in (ONES | TENS) and (current >= 100 or total):
            previous = word
            j += 1
            continue
        else:
            break
        previous = word
        j += 1
    return (str(total + current), j) if j > i else (None, i)


def _atoms(text, joined_words=()):
    raw = [{'text': m.group(), 'from': m.start(), 'to': m.end()} for m in LEX.finditer(text)]
    out, i = [], 0
    while i < len(raw):
        value, j = _integer(raw, i)
        if value is not None:
            # Decimal words are numeric only after a numeric expression, never in "click point".
            if '.' not in value and j < len(raw) and raw[j]['text'].lower() == 'point':
                digits, k = [], j + 1
                while k < len(raw):
                    word = raw[k]['text'].lower()
                    if word in ONES and ONES[word] < 10:
                        digits.append(str(ONES[word]))
                    elif word.isdigit():
                        digits.append(word)
                    else:
                        break
                    k += 1
                if digits:
                    value, j = value + '.' + ''.join(digits), k
            canonical = '~' + format(Decimal(value).normalize(), 'f') + '~'
            out.append({'canonical': canonical, 'from': raw[i]['from'], 'to': raw[j - 1]['to']})
            i = j
        else:
            word = raw[i]['text'].casefold().replace('’', '').replace("'", '')
            out.append({'canonical': 'percent' if word == '%' else word, 'from': raw[i]['from'], 'to': raw[i]['to']})
            i += 1
    # Ignore only approved hyphen boundaries and the explicit ShowMe brand alias.
    # Other word boundaries stay significant ("now here" is not "nowhere").
    merged, i = [], 0
    while i < len(out):
        best = i + 1
        for j in range(i + 2, min(len(out), i + 4) + 1):
            if ''.join(a['canonical'] for a in out[i:j]) in joined_words:
                best = j
        atom = dict(out[i])
        if best > i + 1:
            atom['canonical'] = ''.join(a['canonical'] for a in out[i:best])
            atom['to'] = out[best - 1]['to']
        if not atom['canonical'].startswith('~'):
            atom['canonical'] = '|' + atom['canonical'] + '|'
        merged.append(atom)
        i = best
    out = merged
    position = 0
    for atom in out:
        atom['canonical_start'] = position
        position += len(atom['canonical'])
        atom['canonical_end'] = position
    return out


def align_words(paragraphs, whisper):
    pieces, token_spans, position = [], [], 0
    for segment in whisper.get('transcription', []):
        if 'tokens' not in segment:
            raise AlignmentError('Whisper full JSON token offsets required; use -ojf')
        for token in segment['tokens']:
            text = token.get('text', '')
            if re.fullmatch(r'\[.*\]', text.strip()):
                continue
            offsets = token.get('offsets', {})
            start, end = offsets.get('from'), offsets.get('to')
            if not isinstance(start, (int, float)) or not isinstance(end, (int, float)) or start < 0 or end < start:
                raise AlignmentError('Invalid Whisper token offsets require review')
            pieces.append(text)
            token_spans.append({'from': position, 'to': position + len(text), 'start': start / 1000, 'end': end / 1000})
            position += len(text)
    spoken_text = ''.join(pieces)
    approved_text = '\n\n'.join(paragraphs)
    joined = {'showme'} | {m.group().replace('-', '').lower() for m in re.finditer(r'\b[A-Za-z]+(?:-[A-Za-z]+)+\b', approved_text)}
    approved, spoken = _atoms(approved_text, joined), _atoms(spoken_text, joined)
    expected = ''.join(a['canonical'] for a in approved)
    actual = ''.join(a['canonical'] for a in spoken)
    if expected != actual:
        index = next((i for i, (a, b) in enumerate(zip(expected, actual)) if a != b), min(len(expected), len(actual)))
        raise AlignmentError(f"ASR/approved transcript mismatch near canonical offset {index}: approved {expected[max(0, index-25):index+45]!r}; heard {actual[max(0, index-25):index+45]!r}. Review speech; no estimated alignment written.")
    if not spoken:
        raise AlignmentError('No speech tokens found')
    for atom in spoken:
        owners = [t for t in token_spans if t['from'] < atom['to'] and t['to'] > atom['from']]
        if not owners:
            raise AlignmentError('Word lacks actual token offsets')
        atom['start'], atom['end'] = owners[0]['start'], owners[-1]['end']
    result, paragraph_offset = [], 0
    for paragraph in paragraphs:
        words = []
        for word in re.finditer(r'\S+', paragraph):
            start, end = paragraph_offset + word.start(), paragraph_offset + word.end()
            included = [a for a in approved if a['from'] < end and a['to'] > start]
            if not included:
                # Standalone punctuation belongs to neighbouring speech, not a fabricated time.
                if words:
                    words[-1]['text'] += ' ' + word.group()
                    continue
                raise AlignmentError('Leading standalone punctuation requires review')
            c_start, c_end = included[0]['canonical_start'], included[-1]['canonical_end']
            owners = [a for a in spoken if a['canonical_start'] < c_end and a['canonical_end'] > c_start]
            words.append({'text': word.group(), 'start': owners[0]['start'], 'end': owners[-1]['end']})
        if not words:
            raise AlignmentError('Empty paragraph')
        result.append(words)
        paragraph_offset += len(paragraph) + 2
    return result


def pause_edits(words, silences, needed, padding=0.06):
    candidates = []
    for a, b in silences:
        for left, right in zip(words, words[1:]):
            start, end = max(a, left['end']) + padding, min(b, right['start']) - padding
            if end > start:
                candidates.append((start, end))
    remaining, cuts = needed, []
    for start, end in sorted(candidates, key=lambda x: x[1] - x[0], reverse=True):
        if remaining <= 0.000001:
            break
        amount = min(end - start, remaining)
        # Retain extra padding on both sides of a partly shortened pause.
        cut_start = start + (end - start - amount) / 2
        cuts.append({'start': cut_start, 'end': cut_start + amount})
        remaining -= amount
    if remaining > 0.000001:
        raise AlignmentError(f'Need {needed:.6f}s pause reduction but insufficient verified inter-word silence with padding')
    cuts.sort(key=lambda cut: cut['start'])
    for cut in cuts:
        if any(cut['start'] < word['end'] and cut['end'] > word['start'] or cut['start'] < word['start'] < cut['end'] for word in words):
            raise AlignmentError('Pause edit would intersect a speech-token interval')
    return cuts


def remap_time(time, source_start, cuts):
    return time - source_start - sum(max(0, min(time, cut['end']) - cut['start']) for cut in cuts)


def retained_intervals(start, end, cuts):
    intervals, position = [], start
    for cut in cuts:
        if cut['start'] > position:
            intervals.append((position, cut['start']))
        position = cut['end']
    if end > position:
        intervals.append((position, end))
    return intervals


def caption_cues(words, source_start, max_chars=76, max_seconds=4, cuts=()):
    cues, group = [], []
    for word in words:
        if group and (len(' '.join(x['text'] for x in [*group, word])) > max_chars or remap_time(word['end'], source_start, cuts) - remap_time(group[0]['start'], source_start, cuts) > max_seconds):
            # Do not invent a boundary inside overlapping ASR tokens.
            if word['start'] >= group[-1]['end'] and group[-1]['end'] > group[0]['start']:
                cues.append({'start': remap_time(group[0]['start'], source_start, cuts), 'end': remap_time(group[-1]['end'], source_start, cuts), 'text': ' '.join(x['text'] for x in group)})
                group = []
        group.append(word)
    if group:
        cues.append({'start': remap_time(group[0]['start'], source_start, cuts), 'end': remap_time(group[-1]['end'], source_start, cuts), 'text': ' '.join(x['text'] for x in group)})
    for cue in cues:
        if cue['end'] <= cue['start'] or len(cue['text']) > max_chars:
            raise AlignmentError('Caption token timing requires shorter reviewed boundaries')
    return cues


def plan_segments(paragraphs, silences, duration, slots, padding=0.08, scene_offset=0.15, pause_limits=None):
    if len(paragraphs) != len(slots):
        raise AlignmentError(f'Expected {len(slots)} paragraphs, found {len(paragraphs)}')
    starts, ends = [0.0] * len(slots), [duration] * len(slots)
    first, last = paragraphs[0][0]['start'], paragraphs[-1][-1]['end']
    for a, b in silences:
        if a <= 0.01:
            starts[0] = min(max(0, first - padding), b)
        if b >= duration - 0.01:
            ends[-1] = min(duration, max(last + padding, a))
    for i in range(len(slots) - 1):
        left, right = paragraphs[i][-1]['end'], paragraphs[i + 1][0]['start']
        gaps = [(max(a, left), min(b, right)) for a, b in silences if min(b, right) > max(a, left)]
        if not gaps:
            raise AlignmentError(f'Paragraph boundary {i + 1}: no verified silence between speech tokens; review before cutting')
        a, b = max(gaps, key=lambda gap: gap[1] - gap[0])
        if b - a < 2 * padding:
            ends[i] = starts[i + 1] = (a + b) / 2
        else:
            ends[i], starts[i + 1] = max(a, min(left + padding, b)), min(b, max(right - padding, a))
    plan, overruns = [], []
    for i, (words, slot, start, end) in enumerate(zip(paragraphs, slots, starts, ends)):
        if start > words[0]['start'] + 0.001 or end < words[-1]['end'] - 0.001 or end <= start:
            raise AlignmentError(f'Paragraph {i + 1}: proposed cut intersects speech tokens')
        cuts = []
        need = end - start + scene_offset - slot
        if need > 0.001 and pause_limits and i in pause_limits:
            if need > pause_limits[i] + 0.001:
                raise AlignmentError(f'Scene {i + 1}: needed pause edit {need:.6f}s exceeds approved {pause_limits[i]:.6f}s limit')
            cuts = pause_edits(words, silences, min(need, pause_limits[i]))
        kept = retained_intervals(start, end, cuts)
        segment = {'scene': i, 'source_start': round(start, 6), 'source_end': round(end, 6), 'duration': round(sum(b - a for a, b in kept), 6), 'speech_span': round(remap_time(words[-1]['end'], start, cuts) - remap_time(words[0]['start'], start, cuts), 6), 'slot_seconds': slot, 'scene_offset': scene_offset, 'pause_edits': cuts, 'retained_source_intervals': kept, 'cues': caption_cues(words, start, cuts=cuts)}
        if segment['duration'] + scene_offset > slot + 0.001:
            overruns.append({k: segment[k] for k in ['scene', 'duration', 'speech_span', 'slot_seconds']} | {'overrun_seconds': round(segment['duration'] + scene_offset - slot, 6)})
        plan.append(segment)
    if overruns:
        raise OverrunError(overruns)
    return plan


def run(command):
    return subprocess.run(command, check=True, capture_output=True, text=True)


def seconds(path):
    return float(run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)]).stdout)


def detected_silences(path, duration):
    result = run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path), '-af', 'silencedetect=noise=-40dB:d=0.08', '-f', 'null', '-'])
    spans, start = [], None
    for line in result.stderr.splitlines():
        match = re.search(r'silence_start: ([\d.]+)', line)
        if match:
            start = float(match.group(1))
        match = re.search(r'silence_end: ([\d.]+)', line)
        if match and start is not None:
            spans.append((start, min(duration, float(match.group(1)))))
            start = None
    if start is not None:
        spans.append((start, duration))
    return spans


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def work_directory(key, raw_hash, transcript_hash):
    return BASE / f'{key}-alignment-{raw_hash[:12]}-{transcript_hash[:12]}'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('key', choices=DURATIONS)
    parser.add_argument('raw_audio', type=Path)
    parser.add_argument('--alignment', type=Path, help='Reuse whisper-cli -ojf JSON; avoids retranscription')
    parser.add_argument('--transcript', type=Path, help='Defaults to the authoritative film or X narration')
    parser.add_argument('--output', type=Path, default=BASE / 'segments.json')
    parser.add_argument('--approved-x-pauses', action='store_true', help='Apply approved maximum 0.430s/0.313062s verified inter-word pause trims to X scenes 1/2')
    args = parser.parse_args()
    if args.approved_x_pauses and args.key != 'x':
        parser.error('--approved-x-pauses applies only to the approved X edit')
    raw = args.raw_audio.resolve()
    if not raw.is_file() or not raw.is_relative_to(BASE.resolve()):
        parser.error('Raw audio must exist under docs/video/out/voice/higgsfield/')
    transcript = (args.transcript or VIDEO / ('narration.txt' if args.key == 'film' else 'x-narration.txt')).resolve()
    if args.output.resolve().parent != BASE.resolve():
        parser.error('Manifest output must stay directly under voice/higgsfield/')
    paragraphs = re.split(r'\n\s*\n', transcript.read_text().strip())
    if len(paragraphs) != len(DURATIONS[args.key]):
        parser.error(f'Expected {len(DURATIONS[args.key])} authoritative paragraphs')
    work = work_directory(args.key, sha(raw), sha(transcript))
    work.mkdir(parents=True, exist_ok=True)
    (work / 'source.json').write_text(json.dumps({'raw_sha256': sha(raw), 'transcript_sha256': sha(transcript), 'raw_audio': str(raw), 'approved_transcript': str(transcript)}, indent=2) + '\n')
    converted = work / 'speech-16k.wav'
    if not converted.exists():
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', str(raw), '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', str(converted)])
    alignment = args.alignment or work / 'whisper.json'
    if not alignment.exists():
        if not MODEL.is_file():
            parser.error(f'Installed local Whisper model missing: {MODEL}')
        result = run(['whisper-cli', '-m', str(MODEL), '-f', str(converted), '-l', 'en', '-ojf', '-of', str(work / 'whisper'), '--prompt', '\n\n'.join(paragraphs)])
        (work / 'whisper.log').write_text(result.stderr + '\n' + result.stdout)
    report = {'key': args.key, 'raw_audio': str(raw), 'raw_sha256': sha(raw), 'approved_transcript': str(transcript), 'transcript_sha256': sha(transcript), 'alignment_json': str(alignment.resolve()), 'method': 'Local Whisper token offsets; exact canonical transcript match; detected paragraph-edge silence removed; optional approved inter-word silence trims explicitly logged', 'requiresListeningReview': True, 'approved_interword_pause_edits': args.approved_x_pauses}
    try:
        words = align_words(paragraphs, json.loads(alignment.read_text()))
        length = seconds(raw)
        silences = detected_silences(converted, length)
        plan = plan_segments(words, silences, length, DURATIONS[args.key], pause_limits={0: 0.430, 1: 0.313062} if args.approved_x_pauses else None)
    except AlignmentError as error:
        report |= {'status': 'needs-review', 'error': str(error), 'overruns': getattr(error, 'overruns', [])}
        (work / 'review.json').write_text(json.dumps(report, indent=2) + '\n')
        print(json.dumps(report, indent=2))
        return 2
    target_dir = BASE / 'segments'
    target_dir.mkdir(exist_ok=True)
    manifest = json.loads(args.output.read_text()) if args.output.exists() else {'version': 1, 'segments': {}}
    for i, segment in enumerate(plan):
        target = target_dir / f'{args.key}-{i}.wav'
        if target.exists():
            raise AlignmentError(f'Existing split output preserved: {target}. Review or choose a separate run before overwriting.')
    # All words, boundaries and scene budgets pass before any split or manifest write.
    for i, segment in enumerate(plan):
        target = target_dir / f'{args.key}-{i}.wav'
        intervals = segment['retained_source_intervals']
        filters = [f'[0:a]atrim=start={a:.9f}:end={b:.9f},asetpts=PTS-STARTPTS[p{j}]' for j, (a, b) in enumerate(intervals)]
        filters.append(''.join(f'[p{j}]' for j in range(len(intervals))) + f'concat=n={len(intervals)}:v=0:a=1[out]')
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-i', str(raw), '-filter_complex', ';'.join(filters), '-map', '[out]', '-ar', '48000', '-ac', '1', '-c:a', 'pcm_s16le', str(target)])
        measured = seconds(target)
        if measured + segment['scene_offset'] > segment['slot_seconds'] + 0.001:
            raise AlignmentError(f'{args.key}-{i}: actual split duration overruns; no candidate render permitted')
        manifest['segments'][f'{args.key}-{i}'] = {'kind': 'higgsfield', 'file': str(target.relative_to(BASE)), 'transcript': paragraphs[i], 'offset': segment['scene_offset'], 'cues': segment['cues'], 'alignment': str(alignment.resolve()), 'raw_sha256': report['raw_sha256'], 'source_start': segment['source_start'], 'source_end': segment['source_end'], 'duration': measured, 'pause_edits': segment['pause_edits'], 'retained_source_intervals': segment['retained_source_intervals']}
    args.output.write_text(json.dumps(manifest, indent=2) + '\n')
    report |= {'status': 'aligned-split-pending-listening-review', 'segments': plan, 'manifest': str(args.output), 'manifest_keys': sorted(manifest['segments'])}
    (work / 'review.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (AlignmentError, subprocess.CalledProcessError) as error:
        print(f'Alignment stopped for review: {error}', file=sys.stderr)
        sys.exit(2)
