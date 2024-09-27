import { composePlugins, withNx } from '@nx/next';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },
  // active le mode strict pour détecter les problèmes en dev
  reactStrictMode: true,
  // active la minification
  swcMinify: true,
  experimental: {
    // permet le chargement de nivo
    esmExternals: 'loose',
  },
  // surcharge la config webpack
  webpack: (config) => {
    // pour le chargement des fontes au format woff2
    config.module.rules.push({
      test: /\.woff2$/,
      type: 'asset/resource',
    });

    return config;
  },
  // en-têtes http
  headers: async () => [
    {
      source: '/(.*)', // pour toutes les routes
      headers: [
        // Ref: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ],
    },
  ],
  // Reverse Proxy vers PostHog : https://posthog.com/docs/advanced/proxy/nextjs
  async rewrites() {
    return [
      {
        source: '/ingest/:path*',
        destination: 'https://eu.posthog.com/:path*',
      },
    ];
  },
};

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
];

export default composePlugins(...plugins)(nextConfig);
