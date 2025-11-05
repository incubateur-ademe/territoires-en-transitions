// We don't use direct alias '@/ui' import because
// there's an issue in tailwind alias import with Nx structure
// https://github.com/tailwindlabs/tailwindcss/issues/11097
import { preset } from '../../packages/ui/src/tailwind-preset';

import { Config } from 'tailwindcss';

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
