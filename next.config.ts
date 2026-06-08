import type { NextConfig } from "next";

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
};

export default nextConfig;
