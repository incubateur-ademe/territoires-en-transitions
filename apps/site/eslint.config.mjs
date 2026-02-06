import { defineConfig } from 'eslint/config';
import nextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = defineConfig([
  ...nextjsConfig,
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          allow: ['../../packages/ui/src/tailwind-preset', '@/site'],
        },
      ],
    },
  },
]);

export default eslintConfig;
