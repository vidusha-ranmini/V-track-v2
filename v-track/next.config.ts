import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Additional development optimizations
  experimental: {
    // Remove turbo config as it's not supported in current Next.js version
  },

  // Add empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
