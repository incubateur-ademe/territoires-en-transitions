/// <reference types='vitest' />
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/app',

  plugins: [tsconfigPaths({ projects: ['./tsconfig.project.json'] })],

  // runtime JSX automatique pour les specs de composants (*.spec.tsx)
  esbuild: { jsx: 'automatic' },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    reporters: ['default'],
  },
});
