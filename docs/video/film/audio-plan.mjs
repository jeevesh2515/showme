// WEB-1 / ENG-4: offline audio preflight, precise replacement cues and honest provenance.
import { resolve, sep } from 'node:path';

const clean = (text) => String(text).replace(/\s+/g, ' ').trim();
const inside = (file, directory) => file.startsWith(resolve(directory) + sep);
const finite = (n) => typeof n === 'number' && Number.isFinite(n);

export function narrationDisclosure(plan) {
  const kinds = new Set((Array.isArray(plan) ? plan : plan.segments).map((s) => s.kind));
  if (kinds.size === 1 && kinds.has('founder')) return 'Founder voice · genuine recordings';
  return `AI-generated narration${kinds.has('founder') ? ' · includes genuine founder recording' : ''}`;
}

export function candidatePaths(out, tag, exists, selected = ['film', 'x']) {
  if (!/^[A-Za-z0-9_-]+$/.test(tag)) throw new Error('Candidate tag must contain only letters, numbers, hyphens or underscores');
  const files = {
    film: resolve(out, `ShowMe-3min-hackathon-candidate-${tag}.mp4`),
    x: resolve(out, `ShowMe-X-launch-candidate-${tag}.mp4`),
  };
  for (const file of selected.map((key) => files[key])) {
    if ([file, `${file}.srt`, `${file}.provenance.json`].some(exists)) throw new Error(`Candidate already exists: ${file}; choose a new tag`);
  }
  return files;
}

function measuredCaption(text, width) {
  const lines = [''];
  for (const word of clean(text).split(' ')) {
    if (lines.at(-1) && lines.at(-1).length + word.length + 1 > width) lines.push('');
    lines[lines.length - 1] += (lines.at(-1) ? ' ' : '') + word;
  }
  if (lines.length > 2) throw new Error('Aligned caption too long; provide shorter measured cues instead of estimating word times');
  return lines.join('\n');
}

export function planNarration({ key, paragraphs, scenes, manifest, manifestDir, root, out, duration, legacyIndex = {} }) {
  if (paragraphs.length !== scenes.length) throw new Error(`${key}: scene count differs from approved paragraphs`);
  if (manifest && manifest.version !== 1) throw new Error('Audio manifest version must be 1');
  const plan = { segments: [], clips: [], cues: [], total: scenes.reduce((n, s) => n + s.dur, 0), captionTiming: manifest ? 'aligned replacement cues' : 'draft legacy chunk timing' };
  let sceneStart = 0;
  for (let i = 0; i < scenes.length; i++) {
    const id = `${key}-${i}`, scene = scenes[i], approved = clean(paragraphs[i]);
    const replacement = manifest?.segments?.[id];
    if (manifest && !replacement) throw new Error(`${id}: missing replacement segment`);
    let clips;
    if (replacement) {
      const { kind, genuineRecording, transcript, cues } = replacement;
      if (!['higgsfield', 'founder', 'system'].includes(kind)) throw new Error(`${id}: unsupported narration kind`);
      if (clean(transcript) !== approved) throw new Error(`${id}: replacement differs from approved transcript`);
      if (typeof replacement.file !== 'string') throw new Error(`${id}: audio file missing`);
      const file = resolve(manifestDir, replacement.file);
      if (kind === 'founder') {
        if (genuineRecording !== true) throw new Error(`${id}: founder voice requires genuineRecording: true`);
        if (!inside(file, resolve(out, 'voice/founder'))) throw new Error(`${id}: genuine founder audio must be under voice/founder`);
      }
      if (kind === 'higgsfield' && !inside(file, resolve(out, 'voice/higgsfield'))) throw new Error(`${id}: Higgsfield audio must remain under voice/higgsfield`);
      const d = duration(file), offset = replacement.offset ?? 0.15;
      if (!finite(d) || d <= 0 || !finite(offset) || offset < 0) throw new Error(`${id}: invalid audio duration or offset`);
      if (!Array.isArray(cues) || cues.length === 0 || clean(cues.map((c) => c.text).join(' ')) !== approved) throw new Error(`${id}: caption text differs from approved transcript`);
      let last = 0;
      for (const cue of cues) {
        if (!finite(cue.start) || !finite(cue.end) || cue.start < last || cue.end <= cue.start || cue.end > d + 0.001 || !clean(cue.text)) throw new Error(`${id}: invalid, overlapping or out-of-file caption timing`);
        last = cue.end;
        const right = scene.capRight && offset + cue.start >= scene.capRight[0] && offset + cue.start < scene.capRight[1];
        plan.cues.push({ start: sceneStart + offset + cue.start, end: sceneStart + offset + cue.end, text: measuredCaption(cue.text, right ? 40 : scene.capWidth ?? 52), scene: i });
      }
      clips = [{ file, offset, duration: d }];
      plan.segments.push({ id, kind, genuineRecording: kind === 'founder', file, duration: d, offset, transcript: paragraphs[i] });
    } else {
      const rows = legacyIndex[id];
      if (!Array.isArray(rows) || clean(rows.map((r) => r[1]).join(' ')) !== approved) throw new Error(`${id}: legacy audio differs from approved transcript`);
      clips = [];
      let offset = 0.15;
      for (let ri = 0; ri < rows.length; ri++) {
        if (scene.at?.[ri] !== undefined) offset = scene.at[ri];
        const file = resolve(root, rows[ri][0]), d = duration(file);
        clips.push({ file, offset, duration: d });
        plan.cues.push({ start: sceneStart + offset, end: sceneStart + offset + d, text: rows[ri][1], scene: i });
        offset += d + 0.25;
      }
      plan.segments.push({ id, kind: 'system', genuineRecording: false });
    }
    let previousEnd = 0;
    for (const clip of clips) {
      if (!finite(clip.offset) || !finite(clip.duration) || clip.duration <= 0 || clip.offset < previousEnd - 0.001) throw new Error(`${id}: audio overlap or invalid timing`);
      if (clip.offset + clip.duration > scene.dur + 0.001) throw new Error(`${id}: speech overrun (${(clip.offset + clip.duration).toFixed(3)}s > ${scene.dur}s); trim silence or revise the approved script, never truncate or accelerate speech`);
      previousEnd = clip.offset + clip.duration;
      plan.clips.push({ ...clip, start: sceneStart + clip.offset, scene: i });
    }
    sceneStart += scene.dur;
  }
  return plan;
}
