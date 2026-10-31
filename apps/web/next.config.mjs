/** @type {import('next').NextConfig} */
const backend = process.env.BACKEND_URL ?? "http://localhost:8000";
const dev = process.env.NODE_ENV === "development";
// Pin guide-image host to our Supabase project (SUPABASE_URL is non-secret and set on web in prod).
// Wildcard only in dev; in prod a missing URL means no external images at all, never a silent wildcard (review F6).
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : dev ? "*.supabase.co" : "";
const supabaseImg = supabaseHost ? ` https://${supabaseHost}` : "";
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${backend}/:path*` }];
  },
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        // ARCH §12 Day 5: Supabase signed guide images join img-src (storage host only).
        { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}; worker-src 'self' blob:; img-src 'self' data: blob:${supabaseImg}; connect-src 'self'${dev ? " ws://localhost:*" : ""}; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'` },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-Content-Type-Options", value: "nosniff" },
      ],
    }, {
      // ARCH §8: shared guides are never indexed and never leak the token via Referer.
      source: "/g/:path*",
      headers: [
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
        { key: "Referrer-Policy", value: "no-referrer" },
      ],
    }];
  },
};
export default nextConfig;
