import { afterEach, describe, expect, it, vi } from "vitest";
import { encodeCanvas, fitScale, hasExifMarker, pickEncoding, redact, stripExif } from "./redact";

// Real JPEG (8x8, sharp) with an EXIF APP1 segment carrying a GPS IFD (N 51 30 0, W 0 7 0).
const EXIF_GPS_JPEG =
  "/9j/4AAQSkZJRgABAQAAAQABAAD/4QFgRXhpZgAASUkqAAgAAAAIAA8BAgAGAAAAbgAAABIBAwABAAAAAQAAABoBBQABAAAAdAAAABsBBQABAAAAfAAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAhAAAACWIBAABAAAA0gAAAAAAAABBcHBsZQB/AAAABQAAAH8AAAAFAAAABgAAkAcABAAAADAyMTABkQEABAAAAAECAwAAoAcABAAAADAxMDABoAMAAQAAAP//AAACoAMAAQAAAAgAAAADoAMAAQAAAAgAAAAAAAAABgABAAIAAgAAAE4AAAACAAUAAwAAACABAAADAAIAAgAAAFcAAAAEAAUAAwAAADgBAAAFAAEAAQAAAAAAAAAGAAUAAQAAAFABAAAAAAAAMwAAAAEAAAAeAAAAAQAAAAAAAAABAAAAAAAAAAEAAAAHAAAAAQAAAAAAAAABAAAAIwAAAAEAAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDl6KKK/RT5g//Z";

const exifDataUrl = `data:image/jpeg;base64,${EXIF_GPS_JPEG}`;

function bytes(dataUrl: string): Uint8Array {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(",") + 1));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

function stubCanvas(fillRects: number[][], drawn: unknown[]): void {
  const canvas = {
    width: 0,
    height: 0,
    getContext: (type: string) =>
      type === "2d"
        ? {
            drawImage: (source: unknown) => drawn.push(source),
            fillRect: (x: number, y: number, width: number, height: number) => fillRects.push([x, y, width, height]),
            fillStyle: "",
          }
        : null,
    // Worst case: the browser hands back bytes still carrying EXIF.
    toDataURL: (type?: string) => (type === "image/webp" ? "data:image/png;base64,iVBORw0KGgo=" : exifDataUrl),
  };
  vi.stubGlobal("document", { createElement: () => canvas });
}

afterEach(() => vi.unstubAllGlobals());

describe("redact", () => {
  it("priv-9: stripExif drops the GPS EXIF APP1 segment", () => {
    const input = bytes(exifDataUrl);
    const output = stripExif(input);
    expect(hasExifMarker(input)).toBe(true);
    expect(hasExifMarker(output)).toBe(false);
    expect([output[0], output[1]]).toEqual([0xff, 0xd8]); // still a JPEG
    expect(output.length).toBeLessThan(input.length);
  });

  it("priv-9: stripExif leaves non-JPEG bytes untouched", () => {
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x00]);
    expect(stripExif(png)).toBe(png);
  });

  it("priv-9: encodeCanvas output carries no EXIF even when the canvas returns some", () => {
    const encoded = encodeCanvas({ toDataURL: (type?: string) => (type === "image/webp" ? "data:image/png;base64,AAAA" : exifDataUrl) });
    expect(encoded.mime).toBe("image/jpeg");
    expect(hasExifMarker(bytes(encoded.dataUrl))).toBe(false);
    expect(encoded.bytes).toBe(bytes(encoded.dataUrl).length);
  });

  it("priv-9: encodeCanvas throws rather than emitting EXIF it could not strip", () => {
    // Malformed JPEG: SOI then raw Exif header with no segment structure stripExif can parse.
    const malformed = Uint8Array.from([0xff, 0xd8, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x01]);
    const url = "data:image/jpeg;base64," + Buffer.from(malformed).toString("base64");
    expect(() =>
      encodeCanvas({ toDataURL: (type?: string) => (type === "image/webp" ? "data:image/png;base64,AAAA" : url) }),
    ).toThrow("EXIF");
  });

  it("priv-9: redact() output contains no Exif marker and re-encodes through the canvas", () => {
    const fillRects: number[][] = [];
    const drawn: unknown[] = [];
    stubCanvas(fillRects, drawn);

    const output = redact({ width: 5120, height: 2560 } as unknown as ImageBitmap, [{ x: 100, y: 200, width: 50, height: 20 }]);

    expect(drawn).toHaveLength(1);
    expect(hasExifMarker(bytes(output.dataUrl))).toBe(false);
    expect(output.dataUrl.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect(output.meta.pipeline).toBe("canvas-v1");
    expect(Object.getOwnPropertySymbols(output)).toHaveLength(1); // symbol brand, unforgeable outside redact.ts
  });

  it("priv-1: downscales the bitmap and the region boxes together", () => {
    const fillRects: number[][] = [];
    stubCanvas(fillRects, []);

    const output = redact({ width: 5120, height: 2560 } as unknown as ImageBitmap, [{ x: 100, y: 200, width: 50, height: 20 }]);

    expect({ width: output.meta.width, height: output.meta.height }).toEqual({ width: 2560, height: 1280 });
    expect(fillRects).toEqual([[50, 100, 25, 10]]); // solid block at half scale, never a blur
  });

  it("arch-7: reports manual and auto regions honestly", () => {
    const regions = [
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 20, y: 20, width: 10, height: 10 },
    ];
    stubCanvas([], []);
    const output = redact({ width: 800, height: 600 } as unknown as ImageBitmap, regions, 1);
    expect(output.meta.autoRegions).toBe(1);
    expect(output.meta.manualRegions).toBe(1);
  });

  it("flow-2: caps the long side at 2560 px and never upscales", () => {
    expect(fitScale(3000, 2000)).toEqual({ width: 2560, height: 1707, scale: 2560 / 3000 });
    expect(fitScale(1000, 4000)).toEqual({ width: 640, height: 2560, scale: 0.64 });
    expect(fitScale(1280, 720)).toEqual({ width: 1280, height: 720, scale: 1 });
    expect(fitScale(390, 844)).toEqual({ width: 390, height: 844, scale: 1 });
  });

  it("arch-7: picks WebP only when the browser produced one and it is smaller", () => {
    const jpeg = "data:image/jpeg;base64,AAAAAAAA";
    expect(pickEncoding(jpeg, "data:image/webp;base64,AAA")).toEqual({ dataUrl: "data:image/webp;base64,AAA", mime: "image/webp" });
    expect(pickEncoding(jpeg, "data:image/png;base64,AAA").mime).toBe("image/jpeg");
    expect(pickEncoding(jpeg, "data:image/webp;base64,AAAAAAAAAAAAAAAAAAAA").mime).toBe("image/jpeg");
  });
});
