import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/tools',

  plugins: [
    swc.vite({ tsconfigFile: './tsconfig.spec.json' }),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
  ],

  test: {
    fileParallelism: false,
    watch: false,
    globals: true,
    env: loadEnv(mode, __dirname, ''),

    include: [
      'src/**/*.{test,spec,e2e-spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      './test/**/*.e2e-spec.ts',
    ],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/apps/tools',
      provider: 'v8',
    },
  },
}));
