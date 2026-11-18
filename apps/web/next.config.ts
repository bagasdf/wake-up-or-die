import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  allowedDevOrigins: ["172.19.255.194"],
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
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
      destination: "https://wuod-api.hexagonn.my.id/auth/:path*",
    },
    {
      source: "/api/:path*",
      destination: "https://wuod-api.hexagonn.my.id/v1/:path*",
    },
  ],
};

export default withNextIntl(nextConfig);
