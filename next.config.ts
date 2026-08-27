import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/((?!_next/static|_next/image|favicon\\.ico|icons/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
      headers: [
        { key: "Cache-Control", value: "no-store, must-revalidate" },
      ],
    },
    {
      source: "/_next/static/(.*)",
      headers: [
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    },
  ],
};

export default nextConfig;
