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
      // Would be better to keep it as an error instead of warning, but too much places to fix for now.
      'react-hooks/set-state-in-effect': 'warn',

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
]);

export default eslintConfig;
