import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations
  experimental: {
    optimizePackageImports: ["@crossmint/client-sdk-react-ui"],
  },

  images: {
    domains: ["localhost"],
    unoptimized: process.env.NODE_ENV === "development",
  },

  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
          },
        },
      };
    }

    return config;
  },

  transpilePackages: ["@crossmint/client-sdk-react-ui"],
};

export default nextConfig;
