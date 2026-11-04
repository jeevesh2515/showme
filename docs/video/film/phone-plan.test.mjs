import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validatePhonePlan } from './phone-plan.mjs';

const sha256 = '3cf22fd06fcd02e30b5dffb6b867d11a51401aaf90c285f4138885cc31663068';
const source = { duration: 29.991667, width: 1180, height: 2556, sha256 };
const makePlan = () => ({
  version: 1, sha256, device: 'iPhone 16', selfDemo: true,
  disclosure: 'iPhone 16 · self-demo · navigation cut', recapDuration: 10,
  windows: {
    guide: { start: 6.2, end: 14.2, duration: 8 },
    detail: { start: 16, end: 18.5, duration: 4, holdSeconds: 1.5 },
    original: { start: 26.2, end: 29.6, duration: 4, holdSeconds: 0.6 },
    x: { start: 12.6, end: 18.2, duration: 5.6 },
  },
  excluded: [{ start: 0, end: 6.2 }, { start: 24.2, end: 26.2 }],
});

test('WEB-1 reviewed windows fit exact film and X slots with explicit holds', () => {
  const plan = makePlan();
  plan.windows.detail.crop = { x: 0, y: 700, width: 1180, height: 1200 };
  assert.equal(validatePhonePlan(plan, source), plan);
});

test('WEB-1 rejects action beyond the video stream even if container audio continues', () => {
  const plan = makePlan(); plan.windows.original.end = 30;
  assert.throws(() => validatePhonePlan(plan, source), /original.*bounds/);
});

test('WEB-1 rejects negative, reversed and non-finite source windows', () => {
  for (const update of [{ start: -1 }, { end: 6.1 }, { start: NaN }, { end: Infinity }, { duration: NaN }]) {
    const plan = makePlan(); Object.assign(plan.windows.guide, update);
    assert.throws(() => validatePhonePlan(plan, source), /guide.*bounds/);
  }
});

test('ENG-4 binds phone edits to the reviewed source hash', () => {
  const plan = makePlan(); plan.sha256 = 'a'.repeat(64);
  assert.throws(() => validatePhonePlan(plan, source), /SHA-256 mismatch/);
  assert.throws(() => validatePhonePlan(makePlan(), { ...source, sha256: '' }), /SHA-256 mismatch/);
});

test('WEB-1 rejects implicit holds, mismatched holds and source truncation', () => {
  for (const holdSeconds of [undefined, 1, -1, NaN]) {
    const plan = makePlan(); plan.windows.detail.holdSeconds = holdSeconds;
    assert.throws(() => validatePhonePlan(plan, source), /detail.*holdSeconds/);
  }
  const plan = makePlan(); plan.windows.x.end = 19;
  assert.throws(() => validatePhonePlan(plan, source), /x.*holdSeconds/);
});

test('PRIV-1 excludes keyboard and app-switcher frames, allowing exact touching boundaries', () => {
  const plan = makePlan(); plan.windows.guide.start = 6; plan.windows.guide.end = 14;
  assert.throws(() => validatePhonePlan(plan, source), /guide.*excluded/);
  assert.doesNotThrow(() => validatePhonePlan(makePlan(), source));
});

test('WEB-1 rejects crops outside the original, including non-integer coordinates', () => {
  for (const crop of [
    { x: -1, y: 0, width: 100, height: 100 },
    { x: 1000, y: 0, width: 200, height: 100 },
    { x: 0, y: 2500, width: 100, height: 100 },
    { x: 0.5, y: 0, width: 100, height: 100 },
    { x: 0, y: 0, width: 0, height: 100 },
  ]) {
    const plan = makePlan(); plan.windows.detail.crop = crop;
    assert.throws(() => validatePhonePlan(plan, source), /detail.*crop/);
  }
});

test('WEB-1 slot and recap drift cannot change the agreed runtimes', () => {
  const plan = makePlan(); plan.windows.x.duration = 5.7;
  assert.throws(() => validatePhonePlan(plan, source), /x.*slot duration/);
  const recap = makePlan(); recap.recapDuration = 10.1;
  assert.throws(() => validatePhonePlan(recap, source), /total 26/);
});

test('ENG-4 requires self-demo provenance and a navigation-cut disclosure', () => {
  const missing = makePlan(); missing.selfDemo = false;
  assert.throws(() => validatePhonePlan(missing, source), /provenance/);
  const noSelfDemo = makePlan(); noSelfDemo.disclosure = 'iPhone 16 · recipient';
  assert.throws(() => validatePhonePlan(noSelfDemo, source), /self-demo disclosure/);
  const noCut = makePlan(); noCut.disclosure = 'iPhone 16 · self-demo';
  assert.throws(() => validatePhonePlan(noCut, source), /navigation cut disclosure/);
});

test('WEB-1 rejects malformed source bounds, missing windows and excluded intervals', () => {
  assert.throws(() => validatePhonePlan(makePlan(), { ...source, duration: Infinity }), /source bounds/);
  const missing = makePlan(); delete missing.windows.x;
  assert.throws(() => validatePhonePlan(missing, source), /windows required/);
  const excluded = makePlan(); excluded.excluded[0].end = Infinity;
  assert.throws(() => validatePhonePlan(excluded, source), /excluded window bounds/);
});

const detailFrame = () => ({ sourceTime: 16.8, crop: { x: 100, y: 1340, width: 1000, height: 520 }, label: 'Detail from this recording · held at 16.8s' });

test('WEB-1 rejects held-frame times outside actual video bounds', () => {
  for (const sourceTime of [-1, NaN, Infinity, source.duration]) {
    const plan = makePlan(); plan.heldDetailFrames = [{ ...detailFrame(), sourceTime }];
    assert.throws(() => validatePhonePlan(plan, source), /sourceTime outside video bounds/);
  }
});

test('PRIV-1 held details cannot extract keyboard or app-switcher frames', () => {
  const plan = makePlan(); plan.heldDetailFrames = [{ ...detailFrame(), sourceTime: 25 }];
  assert.throws(() => validatePhonePlan(plan, source), /sourceTime in excluded/);
  plan.heldDetailFrames[0].sourceTime = 26.2;
  assert.doesNotThrow(() => validatePhonePlan(plan, source));
});

test('WEB-1 held details require a bounded integer source crop', () => {
  for (const crop of [undefined, null, { x: 100, y: 1340, width: 1100, height: 520 }, { x: 100, y: 1340.5, width: 1000, height: 520 }]) {
    const plan = makePlan(); plan.heldDetailFrames = [{ ...detailFrame(), crop }];
    assert.throws(() => validatePhonePlan(plan, source), /heldDetailFrames.*crop/);
  }
});

test('ENG-4 held details require an explicit held-frame label', () => {
  for (const label of [undefined, '', '  ', 'Live phone detail', 'Withheld detail']) {
    const plan = makePlan(); plan.heldDetailFrames = [{ ...detailFrame(), label }];
    assert.throws(() => validatePhonePlan(plan, source), /explicit held-frame label/);
  }
});

test('WEB-1 heldDetailFrames must be an array when supplied', () => {
  const plan = makePlan(); plan.heldDetailFrames = detailFrame();
  assert.throws(() => validatePhonePlan(plan, source), /heldDetailFrames must be an array/);
});

test('WEB-1 current authored phone edit validates against the reviewed source', () => {
  const plan = JSON.parse(readFileSync(new URL('./phone-edit.json', import.meta.url), 'utf8'));
  assert.equal(validatePhonePlan(plan, source), plan);
  assert.equal(plan.heldDetailFrames.length, 2);
});
