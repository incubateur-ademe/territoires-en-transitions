import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Le typecheck passe par la cible Nx `typecheck`, comme pour les autres apps.
    ignoreBuildErrors: true,
  },

  // `@tet/ui` réexporte des modules qui dépendent de `@tet/api` et `@tet/domain`.
  transpilePackages: ['@tet/api', '@tet/domain', '@tet/ui'],

  reactStrictMode: true,
};

export default nextConfig;
