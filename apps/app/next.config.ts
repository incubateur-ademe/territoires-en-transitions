import { withPostHogConfig } from '@posthog/nextjs-config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    useTypeScriptCli: false,

    optimizePackageImports: [
      '@tet/api',
      '@tet/domain',
      '@tet/ui',
      '@gouvfr/dsfr',
      'es-toolkit',
      'echarts',
      'react-icons',
      'zod',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
  },

  typescript: {
    // We safely disable the internal type checking of Next.js because
    // all apps are type checked during the first steps of our CI.
    // This avoids redundancy as well as Next.js
    // incomplete support for TypeScript project references.
    ignoreBuildErrors: true,
    tsconfigPath: 'tsconfig.app.json',
  },

  transpilePackages: ['@tet/api', '@tet/domain', '@tet/ui'],

  // Next's output file tracing sometimes misses the ESM variant of
  // @swc/helpers (only copies cjs/), which the standalone server needs
  // at runtime for the proxy. Force the whole package into the trace.
  outputFileTracingIncludes: {
    '/**': ['../../node_modules/@swc/helpers/**/*'],
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Useful for self-hosting in a Docker container
  // See https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',

  generateBuildId: async () => {
    return process.env.GIT_SHORT_HASH || crypto.randomUUID();
  },

  async redirects() {
    return [
      // Outils de plateforme déplacés dans l'espace Administration.
      {
        source: '/ajouter-collectivite',
        destination: '/admin/ajouter-collectivite',
        permanent: true,
      },
      {
        source: '/plans/import',
        destination: '/admin/plans/import',
        permanent: true,
      },
      {
        source: '/banniere',
        destination: '/admin/banniere',
        permanent: true,
      },
      // Ancienne page d'accueil collectivité, supprimée : `/` route vers le
      // bon tableau de bord selon l'utilisateur.
      {
        source: '/collectivite/:collectiviteId/accueil',
        destination: '/',
        permanent: true,
      },
      {
        source: '/collectivite/:collectiviteId/plans/fiches/:ficheId*',
        destination: '/collectivite/:collectiviteId/actions/:ficheId*',
        permanent: true,
      },
      {
        source: '/collectivite/:collectiviteId/plans/:planId/fiches/:ficheId*',
        destination: '/collectivite/:collectiviteId/actions/:ficheId*',
        permanent: true,
      },
      {
        source:
          '/collectivite/:collectiviteId/plans/fiches/toutes-les-fiches/mes-fiches/:path*',
        destination: '/collectivite/:collectiviteId/actions/mes-actions/:path*',
        permanent: true,
      },
      {
        source:
          '/collectivite/:collectiviteId/plans/fiches/toutes-les-fiches/classifiees/:path*',
        destination: '/collectivite/:collectiviteId/actions/dans-plan/:path*',
        permanent: true,
      },
      {
        source:
          '/collectivite/:collectiviteId/plans/fiches/toutes-les-fiches/non-classifiees/:path*',
        destination: '/collectivite/:collectiviteId/actions/hors-plan/:path*',
        permanent: true,
      },
      {
        source:
          '/collectivite/:collectiviteId/plans/fiches/toutes-les-fiches/:path*',
        destination: '/collectivite/:collectiviteId/actions/:path*',
        permanent: true,
      },
      {
        source:
          '/collectivite/:collectiviteId/plans/actions/mes-actions/:path*',
        destination: '/collectivite/:collectiviteId/actions/mes-actions/:path*',
        permanent: true,
      },
      {
        source: '/collectivite/:collectiviteId/plans/actions/dans-plan/:path*',
        destination: '/collectivite/:collectiviteId/actions/dans-plan/:path*',
        permanent: true,
      },
      {
        source: '/collectivite/:collectiviteId/plans/actions/hors-plan/:path*',
        destination: '/collectivite/:collectiviteId/actions/hors-plan/:path*',
        permanent: true,
      },
      {
        source:
          '/collectivite/:collectiviteId/plans/:planId/actions/:actionId*',
        destination: '/collectivite/:collectiviteId/actions/:actionId*',
        permanent: true,
      },
      {
        source: '/collectivite/:collectiviteId/plans/actions/:actionId*',
        destination: '/collectivite/:collectiviteId/actions/:actionId*',
        permanent: true,
      },
    ];
  },

  // https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
  poweredByHeader: false,

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

// Une valeur encore chiffrée par dotenvx vient du .env relu tel quel par
// `next build`, sans déchiffrement (CI hors déploiement) : pas de téléversement.
const getDecryptedEnv = (name: string) => {
  const value = process.env[name];
  return value && !value.startsWith('encrypted:') ? value : undefined;
};

const posthogApiKey = getDecryptedEnv('POSTHOG_API_KEY');
const posthogProjectId = getDecryptedEnv('POSTHOG_PROJECT_ID');

export default posthogApiKey && posthogProjectId
  ? withPostHogConfig(nextConfig, {
      personalApiKey: posthogApiKey,
      projectId: posthogProjectId,
      host: process.env.POSTHOG_HOST,
      sourcemaps: {
        enabled: true,
        deleteAfterUpload: true,
      },
    })
  : nextConfig;
