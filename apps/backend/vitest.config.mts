import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';

const specsAlreadyRunByInitDbSeed = [
  'src/indicateurs/import-indicateurs/import-indicateur-definition.controller.e2e-spec.ts',
  'src/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.controller.e2e-spec.ts',
  'src/referentiels/import-referentiel/import-referentiel.controller.e2e-spec.ts',
];

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend',

  resolve: {
    tsconfigPaths: true,
  },

  test: {
    experimental: {
      fsModuleCache: true,
      fsModuleCachePath: '../../node_modules/.vitest/apps/backend',
    },
    fileParallelism: true,
    watch: false,
    globals: true,
    testTimeout: 20000, // milliseconds (default is 5000)
    hookTimeout: 60000, // milliseconds (default is 10000)
    env: loadEnv(mode, __dirname, ''),

    // Limit CI parallelism: `backend:test` now runs alongside `api:test` in the
    // same job, so letting backend consume all 4 workers saturates the shared
    // Supabase/Redis stack and makes fixture-heavy e2e specs flaky.
    maxWorkers: process.env.CI ? 2 : 4,

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
