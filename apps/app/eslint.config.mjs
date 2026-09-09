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
    files: [
      'src/indicateurs/**/*.{ts,tsx}',
      'src/app/pages/collectivite/Indicateurs/**/*.{ts,tsx}',
      'src/demarches/pcaet/diagnostic/indicateurs-grid/**/*.{ts,tsx}',
      'app/**/_components/score-indicatif/**/*.{ts,tsx}',
    ],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Indicator frontend data must use the typed tRPC React Query hooks.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/**', '@tet/backend/**', '**/initSupabase*'],
              message:
                'Indicator frontend data must flow through tRPC, an application service and a repository.',
            },
          ],
        },
      ],
    },
  },
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
