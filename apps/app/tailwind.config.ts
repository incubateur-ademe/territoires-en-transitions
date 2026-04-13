import { preset } from '@tet/ui/tailwind-preset';
import { Config } from 'tailwindcss';

const SIDE_PANEL_WIDTH = '32rem';

export default {
  presets: [preset],
  content: [
    './**/*.{js,jsx,ts,tsx}',
    '../../packages/ui/src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bf925: '#E3E3FD',
        bf975: '#f5f5fe',
      },
      width: {
        'side-panel': SIDE_PANEL_WIDTH,
      },
      gridTemplateColumns: {
        'side-panel-open': `1fr ${SIDE_PANEL_WIDTH}`,
      },
    },
  },
} satisfies Config;
