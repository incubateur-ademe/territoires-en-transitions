import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

const specsAlreadyRunByInitDbSeed = [
  'src/indicateurs/import-indicateurs/import-indicateur-definition.controller.e2e-spec.ts',
  'src/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.controller.e2e-spec.ts',
  'src/referentiels/import-referentiel/import-referentiel.controller.e2e-spec.ts',
];

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend',

  plugins: [
    swc.vite({ tsconfigFile: './tsconfig.spec.json' }),
    tsconfigPaths({ projects: ['./tsconfig.spec.json'] }),
  ],

  test: {
    fileParallelism: true,
    watch: false,
    globals: true,
    testTimeout: 20000, // milliseconds (default is 5000)
    hookTimeout: 60000, // milliseconds (default is 10000)
    env: loadEnv(mode, __dirname, ''),

    // Limit parallelism: each worker holds a shared NestJS app with its DB
    // pool. More parallel workers than CPU cores saturate CI runners.
    maxWorkers: 4,

    setupFiles: ['./test/vitest-matchers.ts'],

    reporters: ['default'],

    projects: [
      {
        extends: true,
        test: {
          name: 'shared-app',
          isolate: false,
          include: ['src/**/*.{test,spec,e2e-spec}.{ts,mts,cts}'],
          exclude: [...configDefaults.exclude, ...specsAlreadyRunByInitDbSeed],
        },
      },
      {
        extends: true,
        test: {
          name: 'already-run-by-init-db-seed',
          isolate: true,
          include: specsAlreadyRunByInitDbSeed,
        },
      },
    ],
  },
}));
