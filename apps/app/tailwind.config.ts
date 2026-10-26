import { preset } from '@tet/ui/tailwind-preset';
import { Config } from 'tailwindcss';

export default {
  presets: [preset],
  content: [
    './**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
    '../../packages/design-tokens/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bf925: '#E3E3FD',
        bf975: '#f5f5fe',
      },
      height: {
        'matrix-chart': '32rem',
      },
    },
  },
} satisfies Config;
