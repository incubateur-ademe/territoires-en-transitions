/// <reference types="vitest" />
import {defineConfig} from 'vitest/config';
import 'dotenv/config';

export default defineConfig({
  test: {
    maxConcurrency: 1,
    pool: 'forks',
  },
});
