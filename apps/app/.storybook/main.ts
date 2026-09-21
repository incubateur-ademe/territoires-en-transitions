import type { StorybookConfig } from '@storybook/nextjs-vite';
import { config as loadEnv } from 'dotenv';
import { join } from 'node:path';

loadEnv({ path: join(process.cwd(), 'apps/app/.env') });

// @tet/domain est compilé en CommonJS : Vite n'expose ses exports nommés qu'après
// pré-bundling. Tout sous-chemin qu'une story atteint, même indirectement, doit
// donc figurer ici — et lui seul, un sous-chemin sans `dist` échouant à résoudre.
const domainSubpaths = [
  '@tet/domain/collectivites',
  '@tet/domain/demarches',
  '@tet/domain/indicateurs',
  '@tet/domain/metrics',
  '@tet/domain/plans',
  '@tet/domain/referentiels',
  '@tet/domain/shared',
  '@tet/domain/users',
  '@tet/domain/utils',
];

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',

  stories: ['../**/*.stories.@(ts|tsx)'],

  addons: ['@storybook/addon-docs', '@storybook/addon-vitest'],

  core: { disableTelemetry: true },

  typescript: {
    check: true,
  },

  // Storybook n'a pas de serveur Next pour injecter la config runtime : on
  // repasse par l'inlining NEXT_PUBLIC_*, qui reste le repli de `getPublicEnv`.
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      '',
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
