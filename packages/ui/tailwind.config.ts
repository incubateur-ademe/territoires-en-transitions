import { Config } from 'tailwindcss';
import { preset } from './src/tailwind-preset';

export default {
  content: ['./src/**/*.{ts,tsx}'],
  ...preset,
} satisfies Config;
