// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Skip ESLint completely during "next build"
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: if you also want to skip TS type errors during build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
