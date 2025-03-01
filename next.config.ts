import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "i.ytimg.com",
        protocol: "https",
      },
      {
        hostname: "yt3.ggpht.com",
        protocol: "https",
      },
    ],
  },
  webpack: (config) => {
    // Resolve issue with require() in ESM modules
    config.module.rules.push({
      test: /schematic-components\.esm\.js$/,
      resolve: {
        fullySpecified: false, // Fixes ESM import issue
      },
    });

    // Provide fallback for 'fs' module in case it's trying to be used
    config.resolve.fallback = {
      fs: false,
    };

    return config;
  },
};

export default nextConfig;
