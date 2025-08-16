import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'play-lh.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'encrypted-tbn0.gstatic.com',
      }
    ],
  },
  serverExternalPackages: ['google-auth-library'],
  experimental: {
    serverActions: true, // Required for your chat/prediction actions
    serverComponentsExternalPackages: ['mongoose'], // Add if using MongoDB
  },
  env: {
    NEXT_PUBLIC_SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  },
  // Remove these in production (keep only for local debugging)
  typescript: {
    ignoreBuildErrors: false, // Set to false to catch TypeScript errors
  },
  eslint: {
    ignoreDuringBuilds: false, // Set to false to catch ESLint errors
  },
};

export default nextConfig;