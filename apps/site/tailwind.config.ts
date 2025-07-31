import { Config } from 'tailwindcss';
import { preset } from '../../packages/ui/src/tailwind-preset';

export default {
  presets: [preset as Config],
  content: [
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
    './app/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  plugins: [],
} satisfies Config;
