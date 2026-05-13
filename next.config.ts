import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "xrpl", "ws"],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
