import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Enable standalone output for Docker/Synology deployment
  output: 'standalone',
  
  // Disable image optimization if deploying without native dependencies
  // images: {
  //   unoptimized: true,
  // },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default withNextIntl(nextConfig);

