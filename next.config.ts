import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Baseline security headers (defense in depth). The CSP is intentionally
// permissive on script/style ('unsafe-inline') because Next injects inline
// bootstrap/flight scripts and Tailwind/Next emit inline styles; tightening to
// a nonce-based policy is a separate hardening task. CSP is enforced in
// production only so it doesn't break Turbopack HMR (eval/ws) in dev.
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "connect-src 'self' https:",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(isProd
    ? [
        { key: "Content-Security-Policy", value: csp },
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Pin the workspace root so Turbopack doesn't infer it from a parent-directory
  // lockfile (this repo lives inside a larger folder tree).
  turbopack: {
    root: import.meta.dirname,
  },
  reactCompiler: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
