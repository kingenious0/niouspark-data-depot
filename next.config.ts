import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "play-lh.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
        port: "",
        pathname: "/**",
      },
    ],
  },

  // ✅ Updated experimental key
  experimental: {
    serverExternalPackages: ["google-auth-library", "farmhash-modern"],
  },

  env: {
    NEXT_PUBLIC_SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  },

  // ✅ Handle .wasm + silence handlebars warnings
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    config.ignoreWarnings = [
      { module: /handlebars/ }, // hides require.extensions warning
    ];

    return config;
  },
};

export default nextConfig;
