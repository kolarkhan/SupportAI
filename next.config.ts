import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
    // Tree-shake these specifically — they're not in Next's built-in default
    // list, and both ship a lot of code most routes only use a slice of.
    optimizePackageImports: ["recharts", "framer-motion"],
  },
};

export default nextConfig;
