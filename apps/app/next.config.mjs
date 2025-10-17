import { composePlugins } from '@nx/next';
import { uuid4 } from '@sentry/core';
import { withSentryConfig } from '@sentry/nextjs';

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

const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: 'betagouv',
  project: 'territoires-en-transitions',
  sentryUrl: 'https://sentry.incubateur.net/',

  // Useful to upload source maps
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Hides source maps from generated client bundles
  hideSourceMaps: false,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
};

const plugins = [];

export default withSentryConfig(
  composePlugins(...plugins)(nextConfig),
  sentryConfig
);
