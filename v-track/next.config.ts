import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  
  // Disable problematic source maps in development
  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = false;
    }
    return config;
  },
  
  // Empty turbopack config to silence the warning
  turbopack: {},
};

export default nextConfig;
