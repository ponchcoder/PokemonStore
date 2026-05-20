import type { NextConfig } from "next";

const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

const nextConfig: NextConfig = {
  images: {
    // Admin can store image URLs from any source (Supabase Storage, external CDNs,
    // pasted URLs, etc.), so accept any HTTPS host. Per-Image fallbacks use the
    // `unoptimized` prop in case a host responds with hot-link protection.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Prefer modern formats so optimized variants are smaller on the wire.
    formats: ["image/avif", "image/webp"],
    // Default is 60s, which forces Next to re-fetch the upstream image (and
    // re-optimize) for nearly every visitor. A 1-day TTL keeps optimized
    // variants warm in the Next image cache while still letting admins push
    // updates within a day.
    minimumCacheTTL: ONE_DAY_IN_SECONDS,
  },
};

export default nextConfig;
