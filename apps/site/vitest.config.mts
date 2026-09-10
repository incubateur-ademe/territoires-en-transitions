/// <reference types="vitest" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/site',
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@/site': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
  test: {
    watch: false,
    environment: 'node',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    reporters: ['default'],
  },
});
