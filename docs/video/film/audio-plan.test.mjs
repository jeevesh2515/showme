import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { planNarration, narrationDisclosure, candidatePaths } from './audio-plan.mjs';

const root = '/project';
const out = '/project/docs/video/out';
const manifestDir = `${out}/voice/higgsfield`;
const segment = (text, kind = 'higgsfield') => ({ kind, file: text === 'Two.' ? 'film-1.wav' : 'film-0.wav', transcript: text, offset: 0.15, cues: [{ start: 0.2, end: 1.2, text }] });
const plan = (segments, extra = {}) => planNarration({ key: 'film', paragraphs: ['One.', 'Two.'], scenes: [{ dur: 3 }, { dur: 3 }], manifest: { version: 1, segments }, manifestDir, root, out, duration: () => 2, ...extra });

test('WEB-1 every replacement segment contributes to AI narration disclosure', () => {
  const p = plan({ 'film-0': { ...segment('One.', 'founder'), file: '../founder/film-0.wav', genuineRecording: true }, 'film-1': segment('Two.') });
  assert.equal(narrationDisclosure(p), 'AI-generated narration · includes genuine founder recording');
  assert.equal(p.cues[1].start, 3.35);
  assert.equal(p.cues[1].end, 4.35);
});

test('WEB-1 last X segment cannot be mistaken for all-founder narration', () => {
  assert.equal(narrationDisclosure([{ kind: 'founder' }, { kind: 'founder' }, { kind: 'higgsfield' }]), 'AI-generated narration · includes genuine founder recording');
});

test('ENG-4 rejects a synthetic file relabelled as founder voice', () => {
  assert.throws(() => plan({ 'film-0': { ...segment('One.', 'founder'), genuineRecording: true }, 'film-1': segment('Two.') }), /genuine founder.*voice\/founder/);
});

test('ENG-4 rejects founder folder inference without genuine-recording declaration', () => {
  assert.throws(() => plan({ 'film-0': { ...segment('One.', 'founder'), file: '../founder/film-0.wav' }, 'film-1': segment('Two.') }), /genuineRecording/);
});

test('WEB-1 rejects an overrun in the last segment using probed audio duration', () => {
  assert.throws(() => plan({ 'film-0': segment('One.'), 'film-1': segment('Two.') }, { duration: (file) => file.endsWith('film-1.wav') ? 3 : 2 }), /film-1.*overrun/);
});

test('WEB-1 rejects overlapping or out-of-file caption timings', () => {
  const first = segment('One.'); first.cues = [{ start: 0.1, end: 0.8, text: 'One.' }, { start: 0.7, end: 1.0, text: '' }];
  assert.throws(() => plan({ 'film-0': first, 'film-1': segment('Two.') }), /caption/);
});

test('EVAL-7 rejects transcript and cue word or number substitutions', () => {
  assert.throws(() => plan({ 'film-0': segment('1.'), 'film-1': segment('Two.') }), /approved transcript/);
  const first = segment('One.');first.cues[0].text = 'One!';
  assert.throws(() => plan({ 'film-0': first, 'film-1': segment('Two.') }), /caption text/);
});

test('WEB-1 replacement manifest cannot silently omit later scenes', () => {
  assert.throws(() => plan({ 'film-0': segment('One.') }), /film-1.*missing/);
});

test('ENG-4 candidate selection preserves old exports and rejects collisions', () => {
  const p = candidatePaths(out, 'callum-01', () => false);
  assert.equal(p.film, resolve(out, 'ShowMe-3min-hackathon-candidate-callum-01.mp4'));
  assert.equal(p.x, resolve(out, 'ShowMe-X-launch-candidate-callum-01.mp4'));
  assert.throws(() => candidatePaths(out, 'callum-01', () => true), /already exists/);
  assert.throws(() => candidatePaths(out, '../old', () => false), /tag/);
});


test('WEB-1 excessive replacement cue text fails before any rendering', () => {
  const paragraph = Array(40).fill('word').join(' ');
  assert.throws(() => plan({ 'film-0': segment(paragraph), 'film-1': segment('Two.') }, { paragraphs: [paragraph, 'Two.'] }), /caption too long/);
});

test('ENG-4 rejects moving Higgsfield audio into founder storage', () => {
  assert.throws(() => plan({ 'film-0': { ...segment('One.'), file: '../founder/film-0.wav' }, 'film-1': segment('Two.') }), /Higgsfield audio must remain/);
});

test('WEB-1 genuine founder recordings have the same overrun gate', () => {
  assert.throws(() => plan({ 'film-0': segment('One.'), 'film-1': { ...segment('Two.', 'founder'), file: '../founder/film-1.wav', genuineRecording: true } }, { duration: (file) => file.includes('/founder/') ? 3 : 2 }), /film-1.*overrun/);
});
