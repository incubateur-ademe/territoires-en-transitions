/// <reference types='vitest' />

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/apps/backend',

  plugins: [nxViteTsPaths(), swc.vite()],

  test: {
    fileParallelism: false,
    watch: false,
    globals: true,
    env: loadEnv(mode, process.cwd(), ''),

    include: [
      'src/**/*.{test,spec,e2e-spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/**/*.e2e-spec.ts',
    ],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/apps/backend',
      provider: 'v8',
    },
  },
}));
