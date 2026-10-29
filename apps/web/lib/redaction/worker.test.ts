import { describe, expect, it, vi } from "vitest";

vi.mock("tesseract.js", () => ({
  OEM: { LSTM_ONLY: 1 },
  createWorker: async () => ({
    recognize: async () => ({ data: { blocks: null } }),
    terminate: async () => undefined,
  }),
}));

import { recognize } from "./worker";

describe("worker", () => {
  it("priv-1: missing OCR blocks is a failure, never silent 'no private text'", async () => {
    await expect(recognize(new Blob(["x"]))).rejects.toThrow("OCR returned no text blocks");
  });
});
