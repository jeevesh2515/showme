// Spike (d2): can a pixel heuristic find "text inside an input field" so free text (names, addresses)
// gets redacted too? Heuristic: a thin border line above AND below the text line, which keeps running
// well past the end of the text (inputs are wide; buttons hug their label).
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

// Lines that sit inside input fields in the fixtures (ground truth by construction of the HTML).
const TRUTH = {
  billing: ['Jane Doe', '4111', '08/29', '123', '+44', '12 Example'],
  login_mobile: ['grandpa', '07700'],
  settings: ['m.okafor', '+1 415', 'Maria Okafor'],
};

function borderRow(G, w, r, x0, x1, k) {
  let hit = 0, n = 0;
  for (let x = x0; x <= x1; x += 2) {
    const c = G[r * w + x], a = G[(r - k) * w + x], b = G[(r + k) * w + x];
    if (Math.abs(c - a) > 20 && Math.abs(c - b) > 20 && Math.abs(a - b) < 15) hit++;
    n++;
  }
  return hit / n > 0.85;
}

function runLength(G, w, r, x, k) {
  let end = x;
  while (end + 1 < w && Math.abs(G[r * w + end + 1] - G[(r - k) * w + end + 1]) > 20) end++;
  return end;
}

function inInput(G, w, h, b) {
  const lh = b.y1 - b.y0, k = Math.ceil(lh / 8) + 2, reach = Math.round(lh * 2.5);
  const find = (from, to, step) => {
    for (let r = from; step < 0 ? r >= to : r <= to; r += step) {
      if (r - k < 0 || r + k >= h) return -1;
      if (borderRow(G, w, r, b.x0, b.x1, k)) return r;
    }
    return -1;
  };
  const top = find(b.y0 - 2, b.y0 - reach, -1);
  const bot = find(b.y1 + 2, b.y1 + reach, 1);
  if (top < 0 || bot < 0) return false;
  const right = runLength(G, w, top, b.x1, k);
  return right - b.x1 > Math.max(lh * 4, (b.x1 - b.x0) * 0.6);
}

const worker = await createWorker('eng');
for (const [name, truth] of Object.entries(TRUTH)) {
  const file = `fixtures/${name}.png`;
  const { data: G, info } = await sharp(file).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { data } = await worker.recognize(file, {}, { blocks: true });
  const lines = data.blocks.flatMap((bl) => bl.paragraphs.flatMap((p) => p.lines));
  const flagged = lines.filter((l) => inInput(G, info.width, info.height, l.bbox)).map((l) => l.text.trim());
  const tp = truth.filter((t) => flagged.some((f) => f.includes(t)));
  const fp = flagged.filter((f) => !truth.some((t) => f.includes(t)));
  console.log(JSON.stringify({ name, recall: `${tp.length}/${truth.length}`, missed: truth.filter((t) => !tp.includes(t)), falsePositives: fp }));
}
await worker.terminate();
