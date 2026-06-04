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
          allow: ['../../packages/ui/src/tailwind-preset', '@/app'],
          depConstraints: [
            {
              sourceTag: 'frontend',
              bannedExternalImports: ['luxon'],
            },
          ],
        },
      ],

      // Would be better to keep it as an error instead of warning, but too much places to fix for now.
      'react-hooks/set-state-in-effect': 'warn',

      'react/jsx-no-literals': [
        'error',
        { allowedStrings: ['-', '+', '%', '€'] },
      ],
    },
  },
  {
    files: [
      '**/*.stories.tsx',
      '**/fixtures.tsx',
      '**/*.fixtures.tsx',
      '**/fixtures/**/*.tsx',
    ],
    rules: {
      'react/jsx-no-literals': 'off',
    },
  },
]);

export default eslintConfig;


