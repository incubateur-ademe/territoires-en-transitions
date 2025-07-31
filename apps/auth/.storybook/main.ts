import { StorybookConfig } from '@storybook/nextjs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  framework: getAbsolutePath('@storybook/nextjs'),

  stories: ['../**/*.@(stories.@(js|jsx|ts|tsx))'],

  addons: [getAbsolutePath('@storybook/addon-docs')],

  core: { disableTelemetry: true },
};

export default config;

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')));
}
