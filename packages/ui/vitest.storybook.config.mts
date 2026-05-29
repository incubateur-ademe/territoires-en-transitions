import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@tet/ui': path.resolve(dirname, 'src'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
      storybookScript: 'pnpm exec nx storybook ui -- --ci --no-open',
    }),
  ],
  test: {
    root: dirname,
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});
