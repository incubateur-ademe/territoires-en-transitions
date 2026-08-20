/// <reference types='vitest' />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/app',

  resolve: {
    tsconfigPaths: true,
    // Les chemins `@/app/*` vivent dans tsconfig.project.json, que Vite ne lit
    // pas : sans cet alias, tout test qui importe une valeur (et pas seulement
    // un type) d'un module du front échoue à la résolution.
    alias: {
      '@/app': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
  },
});
