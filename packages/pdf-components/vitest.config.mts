/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  cacheDir: '../../node_modules/.vite/packages/pdf-components',

  test: {
    experimental: {
      fsModuleCache: true,
      fsModuleCachePath: '../../node_modules/.vitest/packages/pdf-components',
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
