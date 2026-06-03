import type { NextConfig } from "next";

const DESIGN_DAEMON = process.env.OD_DAEMON_URL || "http://127.0.0.1:7456";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async rewrites() {
    return [
      // Proxy ALL requests under /design-proxy/ to the open-design daemon.
      // The /design page loads Open Design in an iframe pointing at
      // /design-proxy (same-origin). All _next/assets, api calls, and
      // client-side routes resolve through this rewrite — no CORS issues.
      {
        source: "/design-proxy/:path*",
        destination: `${DESIGN_DAEMON}/:path*`,
      },
      // The root of /design-proxy goes to the daemon's /
      {
        source: "/design-proxy",
        destination: `${DESIGN_DAEMON}/`,
      },
      // Server-side API proxy — used by open-design-client.ts and
      // other Jarvis backend calls that hit the daemon's /api/*
      {
        source: "/api/design/:path*",
        destination: `${DESIGN_DAEMON}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
