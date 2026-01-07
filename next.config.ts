import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dimgrey-kudu-283439.hostingersite.com',
      },
    ],
  },
};

export default nextConfig;
