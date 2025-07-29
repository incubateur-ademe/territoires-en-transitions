import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {

  // Useful for self-hosting in a Docker container
  // See https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',

  // Reverse Proxy vers PostHog : https://posthog.com/docs/advanced/proxy/nextjs
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://eu.i.posthog.com/decide",
      },
    ];
  },

  // https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
  poweredByHeader: false,

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
