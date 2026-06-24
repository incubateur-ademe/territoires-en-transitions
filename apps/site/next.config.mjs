const nextConfig = {
  typescript: {
    // We safely disable the internal type checking of Next.js because
    // all apps are type checked during the first steps of our CI.
    // This avoids redundancy as well as Next.js
    // incomplete support for TypeScript project references.
    ignoreBuildErrors: true,
  },

  // Useful for self-hosting in a Docker container
  // See https://nextjs.org/docs/app/api-reference/next-config-js/output#automatically-copying-traced-files
  output: 'standalone',

  // active le mode strict pour détecter le problèmes en dev
  reactStrictMode: true,

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

  // Redirect des anciennes URLs
  async redirects() {
    return [
      {
        source: '/outil-numerique',
        destination: '/plateforme-numerique',
        permanent: true,
      },
    ];
  },

  // https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
  poweredByHeader: false,
};

export default nextConfig;
