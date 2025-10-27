import baseConfig from '../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Disable module boundaries for e2e tests - they're integration tests
      // and don't need to respect internal module boundaries
      '@nx/enforce-module-boundaries': 'off',
    },
  },
];

