import { composePlugins, withNx } from '@nx/next';
import nextMDX from '@next/mdx';
import rehypeToc from 'rehype-toc';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  nx: {
    // Set this to true if you would like to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false,
  },

  // Useful for self-hosting in a Docker container
  // See https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',

  // active le mode strict pour détecter le problèmes en dev
  reactStrictMode: true,
  // active la minification
  swcMinify: true,
  experimental: {
    // permet le chargement de nivo
    esmExternals: 'loose',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.strapiapp.com' },
      { protocol: 'http', hostname: '127.0.0.1' },
    ],
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

// ajoute le traitement des fichiers mdx
const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeExternalLinks,
        { rel: ['noreferrer', 'noopener'], target: '_blank' },
      ],
      [rehypeToc, { cssClasses: { toc: 'md-toc' }, headings: ['h1', 'h2'] }],
    ],
  },
});

const plugins = [
  // Add more Next.js plugins to this list if needed.
  withNx,
  withMDX,
];

export default composePlugins(...plugins)(nextConfig);
