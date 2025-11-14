/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/app',

  plugins: [nxViteTsPaths()],

  resolve: {
    alias: {
      '@/domain/utils': resolve(
        __dirname,
        '../../packages/domain/src/utils/index'
      ),
      '@/domain/plans': resolve(
        __dirname,
        '../../packages/domain/src/plans/index'
      ),
      '@/domain/referentiels': resolve(
        __dirname,
        '../../packages/domain/src/referentiels/index'
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
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/app',
      provider: 'v8',
    },
  },
});
