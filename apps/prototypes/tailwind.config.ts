import { preset } from '@tet/ui/tailwind-preset';
import { Config } from 'tailwindcss';

// Pas d'extension du thème : un prototype n'utilise que les tokens du preset,
// ceux de l'app.
export default {
  presets: [preset],
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/design-tokens/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
