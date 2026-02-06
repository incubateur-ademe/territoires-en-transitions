import { defineConfig } from 'eslint/config';
import nextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = defineConfig([
  ...nextjsConfig,
  ...baseConfig,
]);

export default eslintConfig;
