import type { NextConfig } from "next";

const apiBaseUrl =
  process.env.API_BASE_URL ?? "https://wuod-api.hexagonn.my.id";

const nextConfig: NextConfig = {
  experimental: {
    agentFeedback: true,
  },
  allowedDevOrigins: ["172.19.255.194"],
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "commons.wikimedia.org" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  typedRoutes: true,
  rewrites: () => [
    {
      source: "/api/auth/:path*",
      destination: `${apiBaseUrl}/api/auth/:path*`,
    },
    {
      source: "/api/:path*",
      destination: `${apiBaseUrl}/api/v1/:path*`,
    },
  ],
};

export default nextConfig;
