import nextPlugin from '@next/eslint-plugin-next';
import nxPlugin from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

const config = [
  {
    ignores: ['**/dist'],
  },
  ...nxPlugin.configs['flat/react-typescript'],
  nextPlugin.flatConfig.coreWebVitals,
  ...baseConfig,
  {
    ignores: ['.next/**/*'],
  },
];

export default config;