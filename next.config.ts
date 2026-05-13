import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3", "xrpl", "ws"],
  typedRoutes: false,
};

export default nextConfig;
