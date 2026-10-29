import { describe, expect, it } from "vitest";
import { piiRegions, type OcrLine } from "./regions";

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
