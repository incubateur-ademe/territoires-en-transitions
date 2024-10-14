import { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  framework: '@storybook/nextjs',
  stories: ['../**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],

  addons: ['@storybook/addon-essentials', '@storybook/addon-actions'],

  core: { disableTelemetry: true },
};

export default config;
