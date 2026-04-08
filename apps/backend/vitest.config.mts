import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend',

  plugins: [
    swc.vite({ tsconfigFile: './tsconfig.spec.json' }),
    tsconfigPaths(),
  ],

  test: {
    fileParallelism: true,
    watch: false,
    globals: true,
    testTimeout: 20000, // milliseconds (default is 5000)
    hookTimeout: 60000, // milliseconds (default is 10000)
    env: loadEnv(mode, __dirname, ''),

    // Limit parallelism: each test file creates its own NestJS app with a DB pool
    // of 20 connections. Too many parallel files saturate PostgreSQL.
    maxWorkers: 4,

    setupFiles: ['./test/vitest-matchers.ts'],

    include: ['src/**/*.{test,spec,e2e-spec}.{ts,mts,cts}'],

    reporters: ['default'],
  },
}));
