import { defineConfig } from 'eslint/config';
import { frontendLuxonImportBan } from '../../eslint-frontend.config.mjs';
import eslintNextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = defineConfig([
  ...eslintNextjsConfig,
  ...baseConfig,
  frontendLuxonImportBan(),
]);

export default eslintConfig;
