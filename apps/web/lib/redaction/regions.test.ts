import { describe, expect, it } from "vitest";
import { brushRegion, piiRegions, type OcrLine } from "./regions";

const line = (text: string, words: OcrLine["words"]): OcrLine => ({
  text,
  bbox: { x0: Math.min(...words.map((w) => w.bbox.x0)), y0: Math.min(...words.map((w) => w.bbox.y0)), x1: Math.max(...words.map((w) => w.bbox.x1)), y1: Math.max(...words.map((w) => w.bbox.y1)) },
  words,
});

describe("regions.piiRegions", () => {
  it("flow-2: maps an email match to a padded word box", () => {
    const lines = [line("jane.doe@example.com", [{ text: "jane.doe@example.com", bbox: { x0: 10, y0: 20, x1: 150, y1: 40 } }])];
    expect(piiRegions(lines)).toEqual([{ x: 6, y: 16, width: 148, height: 28 }]);
  });

  it("flow-2: maps a phone split across OCR words", () => {
    const lines = [
      line("Ring +44 7700 900123 now", [
        { text: "Ring", bbox: { x0: 0, y0: 0, x1: 40, y1: 20 } },
        { text: "+44", bbox: { x0: 50, y0: 0, x1: 90, y1: 20 } },
        { text: "7700", bbox: { x0: 100, y0: 0, x1: 140, y1: 20 } },
        { text: "900123", bbox: { x0: 150, y0: 0, x1: 240, y1: 20 } },
        { text: "now", bbox: { x0: 250, y0: 0, x1: 290, y1: 20 } },
      ]),
    ];
    expect(piiRegions(lines)).toEqual([{ x: 46, y: 0, width: 198, height: 28 }]);
  });

  it("flow-2: clamps a padded box to the image edge and ignores clean lines", () => {
    const lines = [
      line("me@example.com", [{ text: "me@example.com", bbox: { x0: 2, y0: 2, x1: 120, y1: 20 } }]),
      line("Looks private enough, continue", [{ text: "Looks", bbox: { x0: 0, y0: 40, x1: 40, y1: 60 } }, { text: "private", bbox: { x0: 50, y0: 40, x1: 100, y1: 60 } }]),
    ];
    expect(piiRegions(lines)).toEqual([{ x: 0, y: 0, width: 126, height: 26 }]);
  });
});

describe("regions.brushRegion", () => {
  const ocr = line("Jane", [{ text: "Jane", bbox: { x0: 150, y0: 120, x1: 200, y1: 140 } }]);

  it("flow-3: never shrinks the drag when it touches an OCR line", () => {
    expect(brushRegion({ x: 100, y: 100, width: 300, height: 100 }, [ocr])).toEqual({ x: 100, y: 100, width: 300, height: 100 });
  });

  it("flow-3: grows to cover the whole touched line", () => {
    expect(brushRegion({ x: 160, y: 125, width: 10, height: 5 }, [ocr])).toEqual({ x: 150, y: 120, width: 50, height: 20 });
  });

  it("flow-3: keeps a drag that touches no line unchanged", () => {
    const drag = { x: 300, y: 300, width: 40, height: 40 };
    expect(brushRegion(drag, [ocr])).toEqual(drag);
  });
});

it("flow-2: a numeric mask extends over touching words with digits, so an OCR misread cannot leave the card's start visible", () => {
  // The real OCR output for the billing example: the first group misreads, Luhn fails, and only the last 12 digits match.
  const words = ["41114:", "1114", "1111", "1111"].map((text, i) => ({ text, bbox: { x0: 200 + i * 60, y0: 330, x1: 250 + i * 60, y1: 345 } }));
  const line = { text: words.map((w) => w.text).join(" "), bbox: { x0: 200, y0: 330, x1: 430, y1: 345 }, words };
  const [region] = piiRegions([line], 0);
  expect(region?.x).toBe(200);
  expect(region?.width).toBe(230);
});

it("flow-2: a text-only neighbour stops the extension, and a postcode does not swallow a house number", () => {
  const make = (texts: string[]) => {
    const words = texts.map((text, i) => ({ text, bbox: { x0: i * 100, y0: 0, x1: i * 100 + 80, y1: 10 } }));
    return { text: texts.join(" "), bbox: { x0: 0, y0: 0, x1: texts.length * 100, y1: 10 }, words };
  };
  expect(piiRegions([make(["2026", "call", "07700", "900123"])], 0)).toEqual([{ x: 200, y: 0, width: 180, height: 10 }]);
  expect(piiRegions([make(["12", "Example", "SW1A", "1AA"])], 0)).toEqual([{ x: 200, y: 0, width: 180, height: 10 }]);
});

