import { defineConfig } from 'eslint/config';
import { frontendEnforceModuleBoundaries } from '../../eslint-frontend.config.mjs';
import nextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';
import noHardcodedAppPath from './eslint-rules/no-hardcoded-app-path.mjs';

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
    files: ['**/*.ts', '**/*.tsx'],
    ignores: [
      '**/src/app/paths.ts',
      '**/next.config.ts',
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.stories.tsx',
      '**/eslint-rules/**',
    ],
    plugins: {
      tet: { rules: { 'no-hardcoded-app-path': noHardcodedAppPath } },
    },
    rules: {
      'tet/no-hardcoded-app-path': 'error',
    },
  },
]);

export default eslintConfig;
