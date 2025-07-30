import type { StorybookConfig } from '@storybook/nextjs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {},
  },

  stories: ['../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [getAbsolutePath('@storybook/addon-docs')],

  core: { disableTelemetry: true },

  typescript: {
    check: true,
    checkOptions: {},
  },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
