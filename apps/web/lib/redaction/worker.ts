// ARCH §7 step 2: OCR in tesseract.js's Web Worker, words grouped into lines.
// All assets are served from our own origin (/public/tesseract) so P7 holds: no CDN at runtime.

import { createWorker, OEM, type Worker } from "tesseract.js";
import type { OcrLine } from "./regions";

export type OcrResult = { readonly lines: readonly OcrLine[]; readonly ms: number };

const ASSETS = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/tesseract`;
// shortcut: the vendored worker/core in public/tesseract were copied from tesseract.js 5.1.x;
// re-copy them from node_modules when that package is upgraded (they must stay in step).

let pending: Promise<Worker> | null = null;

function getWorker(): Promise<Worker> {
  if (!pending) {
    const created: Promise<Worker> = createWorker("eng", OEM.LSTM_ONLY, {
      workerPath: `${ASSETS}/worker.min.js`,
      corePath: ASSETS,
      langPath: ASSETS,
      gzip: false,
    }).catch((error: unknown) => {
      pending = null; // let the next attempt retry instead of caching a failed load
      throw error;
    });
    pending = created;
  }
  return pending;
}

/** OCR one screenshot. The worker is reused, so only the first call pays the model load. */
export async function recognize(image: Blob | HTMLCanvasElement | HTMLImageElement | OffscreenCanvas): Promise<OcrResult> {
  const worker = await getWorker();
  const started = performance.now();
  const { data } = await worker.recognize(image, {}, { blocks: true });
  if (data.blocks == null) throw new Error("OCR returned no text blocks: treating this as an OCR failure, not as 'no private text found'");
  const lines = data.blocks.flatMap((block) =>
    block.paragraphs.flatMap((paragraph) =>
      paragraph.lines.map((line) => ({
        text: line.text.trim(),
        bbox: line.bbox,
        words: line.words.map((word) => ({ text: word.text, bbox: word.bbox })),
      })),
    ),
  );
  return { lines, ms: Math.round(performance.now() - started) };
}

export async function terminateOcr(): Promise<void> {
  const worker = pending;
  pending = null;
  if (worker) await (await worker).terminate();
}
