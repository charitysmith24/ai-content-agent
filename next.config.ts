import type { NextConfig } from "next";
import { dirname, join } from "path";

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
      {
        hostname: "quixotic-gecko-448.convex.cloud",
        protocol: "https",
      },
      {
        hostname: "images.unsplash.com",
        protocol: "https",
      },
    ],
  },
  // Add webpack configuration to handle the Schematic Components warning
  webpack: (config, { isServer }) => {
    // Silence the critical dependency warning for Schematic Components
    config.ignoreWarnings = [
      {
        message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
      },
    ];
    
    return config;
  },
};

export default nextConfig;
