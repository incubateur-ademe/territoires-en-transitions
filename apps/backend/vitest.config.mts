import { loadEnv } from 'vite';
import { configDefaults, defineConfig } from 'vitest/config';
import { BaseSequencer, type TestSpecification } from 'vitest/node';

/**
 * Ces specs ne testent pas, elles peuplent : c'est par elles que la base de
 * test reçoit ses indicateurs, ses questions de personnalisation puis ses
 * référentiels.
 *
 * **L'ordre de cette liste est celui de leurs dépendances**, et il est imposé
 * par le sequencer ci-dessous : l'import d'un référentiel valide chaque
 * expression contre les indicateurs et les questions déjà en base, et échoue
 * sur des centaines d'« indicateurs inexistants » s'il passe le premier.
 *
 * Ajouter un import ici suffit : le projet le prendra dans cet ordre, sans que
 * la CI ait à connaître la liste.
 */
const specsAlreadyRunByInitDbSeed = [
  'src/indicateurs/import-indicateurs/import-indicateur-definition.controller.e2e-spec.ts',
  'src/collectivites/personnalisations/import-personnalisation-questions/import-personnalisation-question.controller.e2e-spec.ts',
  'src/referentiels/import-referentiel/import-referentiel.controller.e2e-spec.ts',
];

/**
 * Joue les specs de peuplement dans l'ordre déclaré ci-dessus. Partout ailleurs
 * l'ordre par défaut s'applique — il répartit la charge entre les workers, on
 * n'y touche pas.
 */
class SeedImportsSequencer extends BaseSequencer {
  async sort(specs: TestSpecification[]): Promise<TestSpecification[]> {
    const rang = ({ moduleId }: TestSpecification) =>
      specsAlreadyRunByInitDbSeed.findIndex((chemin) =>
        moduleId.endsWith(chemin)
      );

    if (specs.every((spec) => rang(spec) === -1)) {
      return super.sort(specs);
    }
    return [...specs].sort((a, b) => rang(a) - rang(b));
  }
}

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
    // Racine et non par projet : `sequence` n'est lu qu'ici.
    sequence: { sequencer: SeedImportsSequencer },
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
          // Séquentiel : ces imports se dépendent, dans l'ordre de la liste.
          // En parallèle, celui des référentiels démarrait avant la fin de
          // celui des indicateurs et échouait sur leur absence — ce qui casse
          // la construction du volume de base de test, et n'apparaît que
          // lorsqu'une modification de `data_layer/` invalide l'image en cache.
          fileParallelism: false,
        },
      },
    ],
  },
}));
