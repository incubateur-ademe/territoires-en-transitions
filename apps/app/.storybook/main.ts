import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',

  stories: ['../**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-docs'],

  core: { disableTelemetry: true },

  typescript: {
    check: true,
  },

  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export default config;
