/// <reference types='vitest' />
import { resolve } from 'path';
import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/packages/api',

  plugins: [
    swc.vite({ tsconfigFile: './tsconfig.spec.json' }),
    tsconfigPaths({ projects: ['../../tsconfig.base.json'] }),
  ],

  resolve: {
    alias: {
      '@tet/domain/utils': resolve(
        __dirname,
        '../../packages/domain/src/utils/index'
      ),
      '@tet/domain/plans': resolve(
        __dirname,
        '../../packages/domain/src/plans/index'
      ),
      '@tet/domain/referentiels': resolve(
        __dirname,
        '../../packages/domain/src/referentiels/index'
      ),
      '@tet/domain/indicateurs': resolve(
        __dirname,
        '../../packages/domain/src/indicateurs/index'
      ),
    },
  },

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
