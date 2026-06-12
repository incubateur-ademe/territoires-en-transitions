import { defineConfig } from 'eslint/config';
import { frontendEnforceModuleBoundaries } from '../../eslint-frontend.config.mjs';
import nextjsConfig from '../../eslint-nextjs.config.mjs';
import baseConfig from '../../eslint.config.mjs';

const eslintConfig = defineConfig([
  ...nextjsConfig,
  ...baseConfig,
  frontendEnforceModuleBoundaries({
    allow: ['../../packages/ui/src/tailwind-preset', '@/panier'],
  }),
]);

export default eslintConfig;
