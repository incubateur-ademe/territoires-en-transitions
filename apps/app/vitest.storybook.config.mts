import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: dirname,
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@/app': path.resolve(dirname, 'src'),
      '@tet/ui/global.css': path.resolve(dirname, '.storybook/vitest.global.css'),
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
  plugins: [
    storybookTest({
      configDir: path.join(dirname, '.storybook'),
      storybookScript: 'pnpm exec nx storybook app -- --ci --no-open',
    }),
  ],
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
    },
  },
});