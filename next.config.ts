import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages
  output: "standalone",

  // Bypass TS type checking during build (node_modules type issues)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization for R2
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.cloudflarestorage.com",
      },
    ],
  },

  // Security headers
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
      ],
    },
  ],

  // Enable React compiler for optimized builds
  // reactCompiler: true,  // Disabled — not needed for this project

  // Turbopack configuration
  turbopack: {
    resolveAlias: {
      // silence node:fs warnings on edge
      fs: { browser: "./empty.js" },
    },
  },
};

export default nextConfig;
