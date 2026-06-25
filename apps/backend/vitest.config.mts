import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';

const specGlob = 'src/**/*.{test,spec,e2e-spec}.{ts,mts,cts}';
const sharedSampleUsers = ['YOLO_DODO', 'YALA_DADA', 'YOULOU_DOUDOU'];
const sharedSampleUsersPattern = new RegExp(
  `\\b(${sharedSampleUsers.join('|')})\\b`
);

const isSpecFile = (path: string): boolean =>
  /\.(test|spec|e2e-spec)\.(ts|mts|cts)$/.test(path);

const usesSharedSampleUsers = (relativeSpecPath: string): boolean =>
  sharedSampleUsersPattern.test(
    readFileSync(join(__dirname, relativeSpecPath), 'utf8')
  );

const sharedStateSpecs = globSync('src/**/*', { cwd: __dirname })
  .filter(isSpecFile)
  .filter(usesSharedSampleUsers);

const testLane = process.env.TEST_LANE;
const isSerialLane = testLane === 'serial';
const isParallelLane = testLane === 'parallel';

const parallelMaxWorkers = Number(process.env.TEST_MAX_WORKERS) || 6;

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/backend',

  plugins: [
    swc.vite({ tsconfigFile: './tsconfig.spec.json' }),
    tsconfigPaths({ projects: ['./tsconfig.spec.json'] }),
  ],

  test: {
    fileParallelism: !isSerialLane,
    watch: false,
    globals: true,
    testTimeout: 20000, // milliseconds (default is 5000)
    hookTimeout: 60000, // milliseconds (default is 10000)
    env: loadEnv(mode, __dirname, ''),

    // Chaque fichier cree sa propre app NestJS avec un pool de 5 connexions
    // (cf. database.service.ts). On plafonne les workers pour ne pas saturer
    // PostgreSQL.
    maxWorkers: isSerialLane ? 1 : parallelMaxWorkers,

    setupFiles: ['./test/vitest-matchers.ts'],

    include: isSerialLane ? sharedStateSpecs : [specGlob],
    exclude: isParallelLane
      ? [...configDefaults.exclude, ...sharedStateSpecs]
      : configDefaults.exclude,

    reporters: ['default'],
  },
}));
