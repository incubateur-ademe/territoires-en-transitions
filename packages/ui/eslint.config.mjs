import nxPlugin from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

const config = [
  {
    ignores: ['**/dist'],
  },
  ...nxPlugin.configs['flat/react-typescript'],
  ...baseConfig,
  {
    ignores: ['storybook-static', 'postcss.config.js'],
  },
];

export default config;