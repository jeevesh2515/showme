// Spike (d): can OCR + regex find PII in a screenshot fast enough to run before upload?
// Runs tesseract.js (same WASM engine the browser uses) on fixture screenshots with known PII,
// reports recall, false positives and latency, and writes *_redacted.png for visual review.
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';
import { performance } from 'node:perf_hooks';

const FIXTURES = {
  billing: ['jane.doe@example.com', '4111 1111 1111 1111', '+44 7700 900123', '(555) 010-4477', 'billing@streamflix.example'],
  login_mobile: ['grandpa.ken1948@gmail.com', '07700 900456'],
  settings: ['m.okafor+shop@outlook.co.uk', '+1 415-555-0198', '5555 5555 5555 4444'],
};

const PATTERNS = {
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  card: /(?:\d[ -]?){12,18}\d/g,
  phone: /\+?\(?\d[\d ().-]{7,}\d/g,
};

const digits = (s) => s.replace(/\D/g, '');
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9@.+]/g, '');

function luhn(num) {
  let sum = 0;
  for (let i = 0; i < num.length; i++) {
    let d = +num[num.length - 1 - i];
    if (i % 2) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  return sum % 10 === 0;
}

function accept(kind, text) {
  const n = digits(text).length;
  if (kind === 'card') return n >= 13 && n <= 19 && luhn(digits(text));
  if (kind === 'phone') return n >= 9 && n <= 15;
  return true;
}

// Join each OCR line's words with offsets so a regex match maps back to word boxes.
function findPII(lines) {
  const hits = [];
  for (const line of lines) {
    let text = '';
    const spans = line.words.map((w) => {
      const start = text.length;
      text += w.text + ' ';
      return { start, end: start + w.text.length, bbox: w.bbox };
    });
    for (const [kind, re] of Object.entries(PATTERNS)) {
      for (const m of text.matchAll(re)) {
        if (!accept(kind, m[0])) continue;
        const [a, b] = [m.index, m.index + m[0].length];
        const boxes = spans.filter((s) => s.start < b && s.end > a).map((s) => s.bbox);
        hits.push({ kind, text: m[0].trim(), boxes });
      }
    }
  }
  return hits;
}

const worker = await createWorker('eng');
const results = [];
for (const [name, truth] of Object.entries(FIXTURES)) {
  const file = `fixtures/${name}.png`;
  const meta = await sharp(file).metadata();
  const t0 = performance.now();
  const { data } = await worker.recognize(file, {}, { blocks: true });
  const ocrMs = performance.now() - t0;
  const lines = data.blocks.flatMap((b) => b.paragraphs.flatMap((p) => p.lines));
  const hits = findPII(lines);

  const found = truth.filter((t) => hits.some((h) => norm(h.text).includes(norm(t)) || (digits(t).length > 8 && digits(h.text) === digits(t))));
  const missed = truth.filter((t) => !found.includes(t));
  const fps = hits.filter((h) => !truth.some((t) => norm(h.text).includes(norm(t)) || norm(t).includes(norm(h.text)) || (digits(t).length > 8 && digits(h.text) === digits(t))));

  const pad = 4;
  const rects = hits.flatMap((h) => h.boxes).map((b) => ({
    input: { create: { width: b.x1 - b.x0 + 2 * pad, height: b.y1 - b.y0 + 2 * pad, channels: 3, background: '#000' } },
    left: Math.max(0, b.x0 - pad), top: Math.max(0, b.y0 - pad),
  }));
  await sharp(file).composite(rects).toFile(`fixtures/${name}_redacted.png`);

  results.push({ name, size: `${meta.width}x${meta.height}`, ocrMs: Math.round(ocrMs), recall: `${found.length}/${truth.length}`, missed, falsePositives: fps.map((h) => `${h.kind}:${h.text}`), hits: hits.map((h) => `${h.kind}:${h.text}`) });
}
await worker.terminate();
console.log(JSON.stringify(results, null, 2));
