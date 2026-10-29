import { defineConfig, mergeConfig } from 'vitest/config';
import base from './vitest.config.mts';

/**
 * Évaluations réelles (appels payants ou sous quota) : jamais dans `nx test`.
 * `make assistant-eval` les lance avec `ASSISTANT_EVAL=1`.
 */
export default defineConfig((env) => {
  const config = base(env);
  return mergeConfig(
    { ...config, test: { ...config.test, projects: undefined } },
    defineConfig({
      test: {
        include: ['src/**/*.live-spec.ts'],
        fileParallelism: false,
        testTimeout: 60 * 60 * 1000,
        hookTimeout: 120_000,
      },
    })
  );
});
