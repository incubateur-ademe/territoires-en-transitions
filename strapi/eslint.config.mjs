import baseConfig from '../eslint.config.mjs';

export default [
  {
    ignores: [
      '**/dist',
      '**/build',
      '**/.cache',
      '**/.tmp',
      '**/node_modules',
      'database/**',
      'types/generated/**',
      'src/admin/**',
      'public/uploads/**',
    ],
  },
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      globals: {
        document: 'readonly',
      },
    },
    rules: {
      // Strapi is a standalone application with its own package.json and dependencies.
      // It's not part of the Nx workspace module system, so Nx module boundaries don't apply.
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];

