import nextPlugin from '@next/eslint-plugin-next';
import nxPlugin from '@nx/eslint-plugin';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import baseConfig from '../../eslint.config.mjs';

const config = [
  {
    ignores: ['**/dist'],
  },
  ...nxPlugin.configs['flat/react-typescript'],
  nextPlugin.flatConfig.coreWebVitals,
  ...baseConfig,
  {
    plugins: {
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    ignores: ['.next/**/*'],
  },
];

export default config;