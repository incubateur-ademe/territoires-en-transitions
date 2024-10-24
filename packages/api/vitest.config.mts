/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/api',

  plugins: [nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  test: {
    fileParallelism: false,
    watch: false,
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    env: loadEnv('', process.cwd(), ''),

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/packages/api',
      provider: 'v8',
    },
  },
});
