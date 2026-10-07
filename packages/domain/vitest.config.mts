/// <reference types="vitest" />
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/packages/domain',

  test: {
    experimental: {
      fsModuleCache: true,
      fsModuleCachePath: '../../node_modules/.vitest/packages/domain',
    },
    root: path.resolve(__dirname),
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    reporters: ['default'],
    testTimeout: 60_000,
  },
});
