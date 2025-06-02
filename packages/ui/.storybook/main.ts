import { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  framework: '@storybook/nextjs',
  addons: ['@storybook/addon-essentials', '@storybook/addon-interactions'],
  stories: ['../src/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],

  docs: {
    autodocs: true,
  },

  core: {
    disableTelemetry: true,
  },
};

export default config;
