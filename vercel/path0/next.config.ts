import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "play-lh.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/**" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com", pathname: "/**" },
    ],
  },
  serverExternalPackages: [
    "google-auth-library",
    "farmhash-modern",
    "firebase-admin",
  ],
  env: {
    NEXT_PUBLIC_SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  },
};

export default nextConfig;
