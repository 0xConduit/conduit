import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
