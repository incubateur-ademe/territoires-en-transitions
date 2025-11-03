import playwright from 'eslint-plugin-playwright';
import baseConfig from '../eslint.config.mjs';

export default [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  {
    ...playwright.configs['flat/recommended'],
    files: ['**/*.ts', '**/*.tsx'],
  },
];

