import js from '@eslint/js';
import nxPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';

// Increase max listeners to prevent warning in Nx monorepo with multiple ESLint plugins

process.setMaxListeners(20);

export default [
  {
    ignores: [
      '**/dist/**',
      'out-tsc',
      '.next',
      'next-env.d.ts',
      '.tsc-trace',
      '**/e2e-cypress-deprecated/**',
      '**/playwright-report/**',
    ],
  },
  ...nxPlugin.configs['flat/base'],
  ...nxPlugin.configs['flat/typescript'],
  ...nxPlugin.configs['flat/javascript'],
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { plugins: { '@nx': nxPlugin } },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // Disable TypeScript-specific rules for JavaScript files
    files: ['**/*.js', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },
];
