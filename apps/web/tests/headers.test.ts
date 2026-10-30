import { describe, expect, it } from "vitest";
// PRIV-8: exact CSP directives, not just header presence. next.config.mjs is the source.
// @ts-expect-error mjs config has no types
import nextConfig from "../next.config.mjs";

describe("security headers (PRIV-8)", () => {
  it("priv-8: CSP pins self, wasm for OCR, no objects, no framing", async () => {
    const rules = await nextConfig.headers();
    const all = rules.flatMap((r: { headers: { key: string; value: string }[] }) => r.headers);
    const csp = all.find((h: { key: string }) => h.key === "Content-Security-Policy")?.value ?? "";
    for (const d of ["default-src 'self'", "worker-src 'self' blob:", "connect-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "'wasm-unsafe-eval'"]) expect(csp).toContain(d);
    expect(csp).not.toContain("https:");
    expect(all.find((h: { key: string }) => h.key === "Strict-Transport-Security")).toBeTruthy();
  });
});
