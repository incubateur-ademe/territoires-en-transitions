import { uuid4 } from '@sentry/core';
import { SentryBuildOptions, withSentryConfig } from '@sentry/nextjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {

  experimental: {
    optimizePackageImports: [
      '@gouvfr/dsfr',
      'es-toolkit',
      'echarts',
      'react-icons',
      'zod',
      '@supabase/supabase-js',
      '@supabase/ssr',
    ],
  },

  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.('.svg')
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports ending in ?url
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: /url/, // *.svg?url
      },
      // Convert all other *.svg imports to React components
      {
        test: /\.svg$/i,
        issuer: fileLoaderRule.issuer,
        resourceQuery: { not: [...fileLoaderRule.resourceQuery.not, /url/] }, // exclude if *.svg?url
        use: ['@svgr/webpack'],
      }
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },

  typescript: {
    tsconfigPath: 'tsconfig.app.json',
  },

  // Useful for self-hosting in a Docker container
  // See https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',

  generateBuildId: async () => {
    // Git hash
    return process.env.EARTHLY_GIT_SHORT_HASH || uuid4();
  },

  // Reverse Proxy vers PostHog : https://posthog.com/docs/advanced/proxy/nextjs
  async rewrites() {
    return [
      {
        source: '/phtr/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/phtr/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ];
  },

  // https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
  poweredByHeader: false,

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};


const isProduction = process.env.NODE_ENV === 'production';

const sentryConfig: SentryBuildOptions = {
  org: 'betagouv',
  project: 'territoires-en-transitions',
  sentryUrl: 'https://sentry.incubateur.net/',

  // Useful to upload source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: isProduction,

  // Hides source maps from generated client bundles
  sourcemaps: {
    disable: !isProduction,
  },

  bundleSizeOptimizations: {
    excludeDebugStatements: !isProduction,
    excludeTracing: !isProduction,
    excludeReplayShadowDom: !isProduction,
    excludeReplayIframe: !isProduction,
    excludeReplayWorker: !isProduction,
  },

  disableManifestInjection: !isProduction,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  webpack: {
    disableSentryConfig: !isProduction,
    autoInstrumentServerFunctions: !isProduction,
    autoInstrumentMiddleware: !isProduction,
    autoInstrumentAppDirectory: !isProduction,

    treeshake: {
      removeDebugLogging: true,
    },
  },
};

export default (process.env.NODE_ENV === 'production') ? withSentryConfig(nextConfig, sentryConfig) : nextConfig;
