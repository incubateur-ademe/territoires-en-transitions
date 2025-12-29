import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',

  stories: ['../src/**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-docs'],

  core: { disableTelemetry: true },

  typescript: {
    check: true,
  },
};

export default config;
