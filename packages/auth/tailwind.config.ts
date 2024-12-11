// We don't use direct alias '@/ui' import because
// there's an issue in tailwind alias import with Nx structure
// https://github.com/tailwindlabs/tailwindcss/issues/11097
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
