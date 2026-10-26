/// <reference types='vitest' />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/prototypes',

  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['eslint/**/*.spec.mjs'],
    reporters: ['default'],
  },
});
