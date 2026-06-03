import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Proxy open-design API calls to the local daemon.
  // The /design page itself uses an iframe pointing at the daemon directly,
  // but API calls from Jarvis (e.g. CLI wrappers) go through this rewrite.
  async rewrites() {
    return [
      {
        source: "/api/design/:path*",
        destination: `http://127.0.0.1:7456/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
