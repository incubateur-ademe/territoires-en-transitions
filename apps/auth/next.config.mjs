
/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // This avoids warnings when ProjectGraph isn't cached during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  output: 'standalone',

  // Experimental memory optimizations
  experimental: {
    webpackMemoryOptimizations: true,
    // Optimize CSS loading
    // optimizeCss: true, // Disabled due to critters module issue in Next.js 15.4.7
  },

  webpack(config, { dev }) {
    if (dev) {
      // Disable source maps in development to save memory
      config.devtool = false;

      // Optimize cache
      config.cache = {
        type: 'filesystem',
        compression: 'gzip',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      };
    }

    return config;
  },

  typescript: {
    tsconfigPath: './tsconfig.json',
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

export default nextConfig;
