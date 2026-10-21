import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Baseline security headers (defense in depth). script/style keep
// 'unsafe-inline' because Next injects inline bootstrap/flight scripts and
// Tailwind/Next emit inline styles. A nonce-based policy is not an option here:
// nonces must be minted per request, which would make every page dynamic and
// drop the static prerendering the app relies on. 'unsafe-eval' is not needed
// by the production build. CSP is enforced in production only so it doesn't
// break Turbopack HMR (eval/ws) in dev.
//
// Remote origins are listed explicitly: the only client fetch off-site is the
// weather lookup, and the only remote image is the Google account avatar
// (catalog and look images are all served from /images and /looks).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "img-src 'self' data: blob: https://*.googleusercontent.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https://api.open-meteo.com",
  "form-action 'self' https://accounts.google.com",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // geolocation=(self)：「偵測今天天氣」按鈕需要定位；=() 會讓它永遠失敗。
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
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
