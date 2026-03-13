import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // Cloudflare IPFS gateway (CDN-backed, much faster than ipfs.io)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cloudflare-ipfs.com",
        pathname: "/ipfs/**",
      },
      {
        // Keep ipfs.io as a fallback for any old references
        protocol: "https",
        hostname: "ipfs.io",
        pathname: "/ipfs/**",
      },
    ],
    // Generate WebP/AVIF versions — dramatically smaller files
    formats: ["image/avif", "image/webp"],
    // Tells Next.js to cache optimized images for 30 days
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
