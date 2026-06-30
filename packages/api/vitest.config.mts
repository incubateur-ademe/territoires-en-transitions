/// <reference types='vitest' />
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/api',

  resolve: {
    tsconfigPaths: true,
  },

  test: {
    fileParallelism: false,
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    env: loadEnv('', process.cwd(), ''),

    reporters: ['default'],
  },
});
