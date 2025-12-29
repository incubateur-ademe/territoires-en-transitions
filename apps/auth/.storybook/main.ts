import { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',

  stories: ['../**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-docs'],

  core: { disableTelemetry: true },
};

export default config;
