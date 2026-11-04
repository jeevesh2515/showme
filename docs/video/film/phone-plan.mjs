// Fail before rendering if an edit would hide a source overrun, unsafe window or hold.
export function validatePhonePlan(plan, source) {
  const fail = (message) => { throw new Error(`Phone plan: ${message}`); };
  const finite = (value) => typeof value === 'number' && Number.isFinite(value);
  const close = (a, b) => Math.abs(a - b) <= 1e-6;
  if (!source || !finite(source.duration) || source.duration <= 0 ||
      !Number.isInteger(source.width) || source.width <= 0 ||
      !Number.isInteger(source.height) || source.height <= 0) fail('invalid probed source bounds');
  const checkCrop = (crop, name) => {
    if (!crop || ![crop.x, crop.y, crop.width, crop.height].every(Number.isInteger) ||
        crop.x < 0 || crop.y < 0 || crop.width <= 0 || crop.height <= 0 ||
        crop.x + crop.width > source.width || crop.y + crop.height > source.height) fail(`${name}: crop outside source bounds`);
  };
  if (!plan || plan.version !== 1) fail('unsupported or missing version');
  if (!/^[a-f0-9]{64}$/i.test(source.sha256 ?? '') || plan.sha256 !== source.sha256) fail('source SHA-256 mismatch');
  if (typeof plan.device !== 'string' || !plan.device.trim() || plan.selfDemo !== true) fail('explicit device and self-demo provenance required');
  if (typeof plan.disclosure !== 'string' || !/self-demo/i.test(plan.disclosure)) fail('self-demo disclosure required');
  if (!Array.isArray(plan.excluded)) fail('excluded windows required');
  for (const interval of plan.excluded) {
    if (!interval || !finite(interval.start) || !finite(interval.end) || interval.start < 0 ||
        interval.end <= interval.start || interval.end > source.duration) fail('invalid excluded window bounds');
  }
  const expected = { guide: 8, detail: 4, original: 4, x: 5.6 };
  if (!plan.windows || Object.keys(plan.windows).length !== 4) fail('exactly guide, detail, original and x windows required');
  for (const [name, duration] of Object.entries(expected)) {
    const window = plan.windows[name];
    if (!window || !finite(window.start) || !finite(window.end) || !finite(window.duration) ||
        window.start < 0 || window.end <= window.start || window.end > source.duration || window.duration <= 0) fail(`${name}: invalid source or duration bounds`);
    if (!close(window.duration, duration)) fail(`${name}: slot duration must be ${duration}`);
    const hold = window.holdSeconds ?? 0;
    if (!finite(hold) || hold < 0 || !close(window.end - window.start + hold, window.duration)) fail(`${name}: explicit holdSeconds must account for the full slot; no truncation or hidden padding`);
    if (plan.excluded.some((interval) => window.start < interval.end && window.end > interval.start)) fail(`${name}: overlaps excluded source window`);
    if (window.crop !== undefined) checkCrop(window.crop, name);
  }
  if (plan.heldDetailFrames !== undefined) {
    if (!Array.isArray(plan.heldDetailFrames)) fail('heldDetailFrames must be an array');
    for (const [index, frame] of plan.heldDetailFrames.entries()) {
      const name = `heldDetailFrames[${index}]`;
      if (!frame || !finite(frame.sourceTime) || frame.sourceTime < 0 || frame.sourceTime >= source.duration) fail(`${name}: sourceTime outside video bounds`);
      if (plan.excluded.some((interval) => frame.sourceTime >= interval.start && frame.sourceTime < interval.end)) fail(`${name}: sourceTime in excluded source window`);
      checkCrop(frame.crop, name);
      if (typeof frame.label !== 'string' || !/\bheld\b/i.test(frame.label)) fail(`${name}: explicit held-frame label required`);
    }
  }
  if (!finite(plan.recapDuration) || !close(plan.recapDuration, 10) ||
      !close(plan.windows.guide.duration + plan.windows.detail.duration + plan.windows.original.duration + plan.recapDuration, 26)) fail('film phone slots plus recap must total 26 seconds');
  const navigationCut = !close(plan.windows.guide.end, plan.windows.detail.start) ||
    !close(plan.windows.detail.end, plan.windows.original.start);
  if (navigationCut && !/navigation cut/i.test(plan.disclosure)) fail('navigation cut disclosure required');
  return plan;
}
