import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

const baseConfig: NextConfig = {
  typescript: {
    // Le typecheck passe par la cible Nx `typecheck`, comme pour les autres apps.
    ignoreBuildErrors: true,
  },

  // `@tet/ui` réexporte des modules qui dépendent de `@tet/api` et `@tet/domain`.
  transpilePackages: ['@tet/api', '@tet/domain', '@tet/ui'],

  reactStrictMode: true,
};

/**
 * Le build produit un site statique (`out/`) aux chemins relatifs : il se
 * déploie tel quel sur n'importe quel hébergement statique (preview Vercel
 * comprise), sans installer le monorepo côté hébergeur.
 */
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
