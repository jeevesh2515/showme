import { describe, expect, it, vi } from "vitest";
// PRIV-8: exact CSP directives, not just header presence. next.config.mjs is the source.
// @ts-expect-error mjs config has no types
import nextConfig from "../next.config.mjs";

describe("security headers (PRIV-8)", () => {
  it("priv-8: CSP pins self, wasm for OCR, no objects, no framing", async () => {
    const rules = await nextConfig.headers();
    const all = rules.flatMap((r: { headers: { key: string; value: string }[] }) => r.headers);
    const csp = all.find((h: { key: string }) => h.key === "Content-Security-Policy")?.value ?? "";
    for (const d of ["default-src 'self'", "worker-src 'self' blob:", "connect-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "base-uri 'none'", "form-action 'self'", "'wasm-unsafe-eval'"]) expect(csp).toContain(d);
    // ARCH §12 Day 5: only Supabase storage (signed guide images) may join img-src; no broad https: anywhere.
    // Test env has no SUPABASE_URL and is not dev, so no external image host is allowed here (review F6).
    expect(csp).toContain("img-src 'self' data: blob:");
    expect(csp).not.toContain("https:");
    expect(all.find((h: { key: string }) => h.key === "Strict-Transport-Security")).toBeTruthy();
  });

  it("priv-8: CSP pins the configured Supabase project host, never a wildcard in prod", async () => {
    vi.resetModules();
    const prev = process.env.SUPABASE_URL;
    process.env.SUPABASE_URL = "https://proj123.supabase.co";
    try {
      // @ts-expect-error mjs config has no types
      const cfg = (await import("../next.config.mjs")).default as typeof nextConfig;
      const rules = await cfg.headers();
      const all = rules.flatMap((r: { headers: { key: string; value: string }[] }) => r.headers);
      const csp = all.find((h: { key: string }) => h.key === "Content-Security-Policy")?.value ?? "";
      expect(csp).toContain("img-src 'self' data: blob: https://proj123.supabase.co");
      expect(csp).not.toContain("*.supabase.co");
    } finally {
      if (prev === undefined) delete process.env.SUPABASE_URL;
      else process.env.SUPABASE_URL = prev;
      vi.resetModules();
    }
  });

  it("priv-5: /g/* sends noindex and no-referrer (ARCH §8)", async () => {
    const rules = await nextConfig.headers();
    const g = rules.find((r: { source: string }) => r.source === "/g/:path*");
    const hs = Object.fromEntries((g?.headers ?? []).map((h: { key: string; value: string }) => [h.key, h.value]));
    expect(hs["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(hs["Referrer-Policy"]).toBe("no-referrer");
  });
});
