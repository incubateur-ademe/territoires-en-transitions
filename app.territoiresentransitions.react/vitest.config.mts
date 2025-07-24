/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../node_modules/.vite/app.territoiresentransitions.react',

  plugins: [nxViteTsPaths()],

  resolve: {
    alias: {
      '@/backend': resolve(__dirname, '../backend/src'),
      '@/domain/plans/fiches': resolve(
        __dirname,
        '../backend/src/plans/fiches/index-domain.ts'
      ),
    },
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  test: {
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/app.territoiresentransitions.react',
      provider: 'v8',
    },
  },
});
