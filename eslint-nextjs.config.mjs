import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig } from 'eslint/config';

const eslintNextjsConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 'react-hooks/rules-of-hooks': 'error',
      // 'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);

export default eslintNextjsConfig;
