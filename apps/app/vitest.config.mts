/// <reference types='vitest' />
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/app',

  plugins: [tsconfigPaths({ projects: ['./tsconfig.project.json'] })],

  resolve: {
    // Fallback alias for spec files in app/ that are excluded from tsconfig.project.json
    // (vite-tsconfig-paths skips excluded files, so we register the alias explicitly here)
    alias: {
      '@/app': path.resolve(__dirname, 'src'),
    },
  },

  // runtime JSX automatique pour les specs de composants (*.spec.tsx)
  esbuild: { jsx: 'automatic' },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      // proxy.spec.ts vit à la racine de l'app (à côté de proxy.ts)
      '*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    reporters: ['default'],
  },
});
