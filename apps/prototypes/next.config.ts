import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

const baseConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  transpilePackages: ['@tet/api', '@tet/domain', '@tet/ui'],

  reactStrictMode: true,
};

const staticExportConfig: NextConfig = {
  output: 'export',
  assetPrefix: '.',
  images: { unoptimized: true },
};

const nextConfig = (phase: string): NextConfig =>
  phase === PHASE_PRODUCTION_BUILD
    ? { ...baseConfig, ...staticExportConfig }
    : baseConfig;

export default nextConfig;
