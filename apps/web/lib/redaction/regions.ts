// ARCH §7 step 3: map pattern matches back to padded OCR word boxes.
// Kept free of tesseract.js so it can be unit-tested without the OCR engine.

import { findPii } from "./patterns";
import type { Region } from "./types";

export type BBox = { readonly x0: number; readonly y0: number; readonly x1: number; readonly y1: number };
export type OcrWord = { readonly text: string; readonly bbox: BBox };
export type OcrLine = { readonly text: string; readonly bbox: BBox; readonly words: readonly OcrWord[] };

const PAD = 4; // ARCH §7 step 3

export function piiRegions(lines: readonly OcrLine[], pad = PAD): Region[] {
  const regions: Region[] = [];
  for (const line of lines) {
    let text = "";
    const offsets = line.words.map((word) => {
      const start = text.length;
      text += `${word.text} `;
      return { start, end: start + word.text.length, bbox: word.bbox };
    });
    for (const span of findPii(text)) {
      const boxes = offsets.filter((o) => o.start < span.end && o.end > span.start).map((o) => o.bbox);
      if (boxes.length === 0) continue;
      const x0 = Math.min(...boxes.map((b) => b.x0));
      const y0 = Math.min(...boxes.map((b) => b.y0));
      const x1 = Math.max(...boxes.map((b) => b.x1));
      const y1 = Math.max(...boxes.map((b) => b.y1));
      regions.push({ x: Math.max(0, x0 - pad), y: Math.max(0, y0 - pad), width: x1 - x0 + 2 * pad, height: y1 - y0 + 2 * pad });
    }
  }
  return regions;
}
