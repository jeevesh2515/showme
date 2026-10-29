// PRIV-1: the raw screenshot never leaves the browser. Only `redact()` (redact.ts)
// may create a RedactedImage; the private brand below is what stops any other code
// from handing arbitrary bytes to the API client.

export type Region = {
  /** Source-image pixels; redact() scales them with the image. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

export type RedactionMeta = {
  /** Size of the encoded image actually sent, after downscaling. */
  readonly width: number;
  readonly height: number;
  readonly mime: "image/jpeg" | "image/webp";
  readonly bytes: number;
  readonly autoRegions: number;
  readonly manualRegions: number;
  /** Matches backend `ImageMeta.redaction.pipeline`, which it rejects when empty. */
  readonly pipeline: "canvas-v1";
};

export type { RedactedImage } from "./redact";
