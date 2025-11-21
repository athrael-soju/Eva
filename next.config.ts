import type { NextConfig } from "next";

console.log("Loading Next.js Configuration...");

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    console.log("Registering rewrites...");
    return [
      {
        source: '/mcp',
        destination: 'http://localhost:8000/mcp',
      },
      {
        source: '/mcp/:path*',
        destination: 'http://localhost:8000/mcp/:path*',
      },
    ];
  },
};

export default nextConfig;
