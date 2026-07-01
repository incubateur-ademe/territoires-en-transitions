import type { StorybookConfig } from '@storybook/nextjs-vite';
import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';

loadEnv({ path: join(process.cwd(), 'apps/app/.env') });

const domainSubpaths = [
  '@tet/domain/collectivites',
  '@tet/domain/collectivites/tableau-de-bord',
  '@tet/domain/indicateurs',
  '@tet/domain/plans',
  '@tet/domain/referentiels',
  '@tet/domain/shared',
  '@tet/domain/users',
  '@tet/domain/utils',
];

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

  async viteFinal(viteConfig) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(viteConfig, {
      optimizeDeps: {
        include: domainSubpaths,
      },
    });
  },
};

export default config;
