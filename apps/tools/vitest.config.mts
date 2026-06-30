import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/tools',

  resolve: {
    tsconfigPaths: true,
  },

  test: {
    fileParallelism: false,
    watch: false,
    globals: true,
    env: loadEnv(mode, __dirname, ''),

    include: [
      'src/**/*.{test,spec,e2e-spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/**/*.e2e-spec.ts',
    ],

    reporters: ['default'],
  },
}));
