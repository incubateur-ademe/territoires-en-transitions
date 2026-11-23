import { defineConfig } from 'eslint/config';
import { frontendEnforceModuleBoundaries } from '../../eslint-frontend.config.mjs';
import nextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';
import { tetEslintPlugin } from './eslint/no-hardcoded-ui-copy.mjs';

const eslintConfig = defineConfig([
  ...nextjsConfig,
  ...baseConfig,
  frontendEnforceModuleBoundaries({
    allow: ['../../packages/ui/src/tailwind-preset', '@/app'],
  }),
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'react/jsx-no-literals': [
        'error',
        { allowedStrings: ['-', '+', '%', '€'] },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      'src/labels/**',
      '**/*.stories.tsx',
      '**/fixtures.tsx',
      '**/*.fixtures.tsx',
      '**/fixtures/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
    ],
    plugins: { tet: tetEslintPlugin },
    rules: {
      'tet/no-hardcoded-ui-copy': 'warn',
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
  {
    files: [
      'src/app/pages/collectivite/Indicateurs/detail/predefini/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/perso/**'],
              message:
                'Predefini components must not depend on the perso folder: share the code in a neutral folder of the detail page.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'src/app/pages/collectivite/Indicateurs/detail/perso/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/predefini/**'],
              message:
                'Perso components must not depend on the predefini folder: share the code in a neutral folder of the detail page.',
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
