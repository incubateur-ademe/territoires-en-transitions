import { Config } from 'tailwindcss';
import { preset } from '../ui/src/tailwind-preset';

export default {
  presets: [preset as Config],
  content: [
    '../ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
} satisfies Config;
