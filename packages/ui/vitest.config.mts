/// <reference types="vitest" />
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  cacheDir: '../../node_modules/.vite/packages/ui',

  resolve: {
    tsconfigPaths: true,
  },

  test: {
    experimental: {
      fsModuleCache: true,
      fsModuleCachePath: '../../node_modules/.vitest/packages/ui',
    },
    root: dirname,
    watch: false,
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    reporters: ['default'],
  },
});
