import { Config } from 'tailwindcss';
import { preset } from './src/tailwind-preset';

export default {
  presets: [preset],
  content: ['./src/**/*.{ts,tsx}'],
} satisfies Config;
