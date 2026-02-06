import { defineConfig } from 'eslint/config';
import eslintNextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = defineConfig([
  ...eslintNextjsConfig,
  ...baseConfig,
]);

export default eslintConfig;
