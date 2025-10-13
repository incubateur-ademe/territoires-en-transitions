import playwright from 'eslint-plugin-playwright';
import baseConfig from '../eslint.config.mjs';

// Ensure max listeners is set (also set in base config)
// eslint-disable-next-line no-undef
process.setMaxListeners(20);

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

