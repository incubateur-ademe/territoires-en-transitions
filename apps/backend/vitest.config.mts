import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend',

  plugins: [
    swc.vite({ tsconfigFile: './tsconfig.spec.json' }),
    tsconfigPaths(),
  ],

  test: {
    fileParallelism: false,
    watch: false,
    globals: true,
    env: loadEnv(mode, __dirname, ''),

    setupFiles: ['./test/vitest-matchers.ts'],

    include: ['src/**/*.{test,spec,e2e-spec}.{ts,mts,cts}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/apps/backend',
      provider: 'v8',
    },
  },
}));
