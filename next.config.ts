import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // next/image only loads photos from hosts listed here.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-*" }],
    // AVIF first (smallest), WebP for browsers that can't show AVIF.
    formats: ["image/avif", "image/webp"],
    qualities: [60, 75],
  },
  experimental: {
    // Tailwind's CSS is small, so put it straight into the HTML: one less round trip on phones.
    inlineCss: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
