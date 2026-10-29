// ARCH §7 step 5: canvas re-encode with solid blocks. This module is the only
// constructor of RedactedImage (PRIV-1) and drops EXIF even if a browser ever kept it (PRIV-9).

import type { RedactionMeta, Region } from "./types";

// Symbol brand defined here and never exported: only redact() below can construct
// a RedactedImage; an object literal elsewhere cannot name this key (PRIV-1).
const brand = Symbol("RedactedImage");
export type RedactedImage = {
  readonly dataUrl: string;
  readonly meta: RedactionMeta;
  readonly [brand]: true;
};

export const MAX_LONG_SIDE = 2560; // D20: 2560 px measured equal to native on dev-100.
export const JPEG_QUALITY = 0.85;

const JPEG_PREFIX = "data:image/jpeg;base64,";
const WEBP_PREFIX = "data:image/webp;base64,";
const EXIF_ID = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00]; // "Exif\0\0"

export type Encoded = { readonly dataUrl: string; readonly mime: "image/jpeg" | "image/webp"; readonly bytes: number };

export function fitScale(width: number, height: number, maxLongSide = MAX_LONG_SIDE): { width: number; height: number; scale: number } {
  const long = Math.max(width, height);
  const scale = long > maxLongSide ? maxLongSide / long : 1;
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)), scale };
}

/** WebP only when the browser actually produced one and it is smaller (ARCH §7 step 5). */
export function pickEncoding(jpeg: string, webp: string): { dataUrl: string; mime: "image/jpeg" | "image/webp" } {
  if (webp.startsWith(WEBP_PREFIX) && webp.length < jpeg.length) return { dataUrl: webp, mime: "image/webp" };
  return { dataUrl: jpeg, mime: "image/jpeg" };
}

export function hasExifMarker(bytes: Uint8Array): boolean {
  for (let i = 0; i <= bytes.length - EXIF_ID.length; i++) {
    if (EXIF_ID.every((byte, j) => bytes[i + j] === byte)) return true;
  }
  return false;
}

/** Drop every APP1 segment (Exif/XMP). Anything malformed is returned untouched. */
export function stripExif(jpeg: Uint8Array): Uint8Array {
  if (jpeg.length < 4 || jpeg[0] !== 0xff || jpeg[1] !== 0xd8) return jpeg;
  const chunks: Uint8Array[] = [jpeg.subarray(0, 2)];
  let i = 2;
  while (i + 1 < jpeg.length && jpeg[i] === 0xff) {
    const marker = jpeg[i + 1] ?? -1;
    if (marker === 0xff) {
      i++; // fill byte
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // scan data / end of image: copy verbatim
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      chunks.push(jpeg.subarray(i, i + 2)); // standalone markers carry no length
      i += 2;
      continue;
    }
    if (i + 4 > jpeg.length) return jpeg;
    const length = ((jpeg[i + 2] ?? 0) << 8) | (jpeg[i + 3] ?? 0);
    const end = i + 2 + length;
    if (length < 2 || end > jpeg.length) return jpeg;
    if (marker !== 0xe1) chunks.push(jpeg.subarray(i, end));
    i = end;
  }
  chunks.push(jpeg.subarray(i));
  const size = chunks.reduce((n, chunk) => n + chunk.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Re-encode through the canvas (drops metadata), then strip APP1 as a second line of defence. */
export function encodeCanvas(canvas: Pick<HTMLCanvasElement, "toDataURL">): Encoded {
  const picked = pickEncoding(canvas.toDataURL("image/jpeg", JPEG_QUALITY), canvas.toDataURL("image/webp", JPEG_QUALITY));
  if (picked.mime === "image/webp") {
    const webpBytes = base64ToBytes(picked.dataUrl);
    if (hasExifMarker(webpBytes)) throw new Error("EXIF marker survived WebP encode: refusing to emit image");
    return { dataUrl: picked.dataUrl, mime: "image/webp", bytes: webpBytes.length };
  }
  const original = base64ToBytes(picked.dataUrl);
  const stripped = stripExif(original);
  if (hasExifMarker(stripped)) throw new Error("EXIF could not be stripped: refusing to emit image");
  if (stripped.length === original.length) return { dataUrl: picked.dataUrl, mime: "image/jpeg", bytes: original.length };
  return { dataUrl: JPEG_PREFIX + bytesToBase64(stripped), mime: "image/jpeg", bytes: stripped.length };
}

/**
 * Draw the decoded screenshot, fill every region with a solid block (never a
 * reversible blur), downscale, and return the only value the API client accepts.
 */
export function redact(bitmap: ImageBitmap, regions: readonly Region[], manualRegions = 0): RedactedImage {
  const { width, height, scale } = fitScale(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable: cannot redact, refusing to emit an image");
  ctx.drawImage(bitmap, 0, 0, width, height);
  ctx.fillStyle = "#000";
  for (const region of regions) {
    ctx.fillRect(
      Math.round(region.x * scale),
      Math.round(region.y * scale),
      Math.ceil(region.width * scale),
      Math.ceil(region.height * scale),
    );
  }
  const encoded = encodeCanvas(canvas);
  const manual = Math.min(Math.max(0, Math.trunc(manualRegions)), regions.length);
  const meta: RedactionMeta = {
    width,
    height,
    mime: encoded.mime,
    bytes: encoded.bytes,
    autoRegions: regions.length - manual,
    manualRegions: manual,
    pipeline: "canvas-v1",
  };
  // PRIV-1: this module is the only place a RedactedImage is constructed.
  return { dataUrl: encoded.dataUrl, meta, [brand]: true as const };
}

function base64ToBytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
