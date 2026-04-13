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
    fileParallelism: true,
    watch: false,
    globals: true,
    testTimeout: 10000, // milliseconds (default is 5000)
    env: loadEnv(mode, __dirname, ''),

    setupFiles: ['./test/vitest-matchers.ts'],

    include: ['src/**/*.{test,spec,e2e-spec}.{ts,mts,cts}'],

    // Ces fichiers modifient des tables globales (referentiel_definition,
    // indicateur_definition, question) et ne doivent PAS s'exécuter en
    // parallèle avec les autres tests. Les lancer séparément :
    // npx vitest src/referentiels/import-referentiel/
    exclude: [
      'src/referentiels/import-referentiel/**',
      'src/indicateurs/definitions/import-indicateur-definition/**',
      'src/collectivites/personnalisations/import-personnalisation-question/**',
    ],

    reporters: ['default'],
  },
}));
