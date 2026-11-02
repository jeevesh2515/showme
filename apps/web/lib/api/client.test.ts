import { afterEach, expect, it, vi } from "vitest";
import { redact } from "../redaction/redact";
import { ApiClientError, MAX_GUIDE_PAYLOAD_CHARS, createGuide, type GuideStepInput } from "./client";

afterEach(() => vi.unstubAllGlobals());

it("api-6: createGuide refuses a share over the aggregate payload budget before any request", async () => {
  // A real redact() output (canvas stubbed) whose data URL is ~1 MB; five of them exceed the 4M-char budget.
  const big = `data:image/png;base64,${"A".repeat(1_000_000)}`;
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => {}, fillRect: () => {}, fillStyle: "" }), toDataURL: () => big }),
  });
  const image = redact({ width: 800, height: 600 } as unknown as ImageBitmap, []);
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const steps: GuideStepInput[] = Array.from({ length: 5 }, (_, i) => ({ n: i + 1, instruction: "Tap", status: "ok", caution: "", image, target: null, svgPath: null, svgOrigin: null }));
  expect(steps.reduce((n, s) => n + s.image.dataUrl.length, 0)).toBeGreaterThan(MAX_GUIDE_PAYLOAD_CHARS);

  const err = await createGuide("goal", steps, true).catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiClientError);
  expect((err as ApiClientError).code).toBe("payload_too_large");
  expect(fetchSpy).not.toHaveBeenCalled();
});

it("priv-5: a long model caution is trimmed to the guide API limit, so sharing does not fail", async () => {
  vi.stubGlobal("document", { createElement: () => ({ width: 0, height: 0, getContext: () => ({ drawImage: () => {}, fillRect: () => {}, fillStyle: "" }), toDataURL: () => "data:image/png;base64,AA" }) });
  const image = redact({ width: 800, height: 600 } as unknown as ImageBitmap, []);
  const fetchSpy = vi.fn(async () => new Response(JSON.stringify({ url: "u", delete_key: "k", expires_at: "x" }), { status: 200 }));
  vi.stubGlobal("fetch", fetchSpy);
  await createGuide("goal", [{ n: 1, instruction: "Tap", status: "ok", caution: "x".repeat(400), image, target: null, svgPath: null, svgOrigin: null }], true);
  const [, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
  expect((JSON.parse(String(init.body)) as { steps: { caution: string }[] }).steps[0]?.caution).toHaveLength(300);
});

