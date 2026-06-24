
/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  typescript: {
    // We safely disable the internal type checking of Next.js because
    // all apps are type checked during the first steps of our CI.
    // This avoids redundancy as well as Next.js
    // incomplete support for TypeScript project references.
    ignoreBuildErrors: true,
    tsconfigPath: './tsconfig.app.json',
  },

  output: 'standalone',

  // https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader
  poweredByHeader: false,

  // This is required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
