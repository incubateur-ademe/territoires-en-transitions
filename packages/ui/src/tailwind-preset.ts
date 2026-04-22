import { designTokens } from '@tet/design-tokens';
import { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

export const preset = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    maxHeight: designTokens.maxHeight,
    extend: {
      fontFamily: {
        sans: [...designTokens.fontFamily.sans],
      },
      colors: designTokens.colors,
      fontSize: designTokens.fontSize,
      fontWeight: designTokens.fontWeight,
      boxShadow: designTokens.boxShadow,
      screens: designTokens.screens,
      maxWidth: designTokens.maxWidth,
      zIndex: designTokens.zIndex,
      animation: designTokens.animation,
      backgroundImage: {
        'close-circle-fill': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='rgba(106,106,244,1)'%3E%3Cpath d='M12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22ZM12 10.5858L9.17157 7.75736L7.75736 9.17157L10.5858 12L7.75736 14.8284L9.17157 16.2426L12 13.4142L14.8284 16.2426L16.2426 14.8284L13.4142 12L16.2426 9.17157L14.8284 7.75736L12 10.5858Z'%3E%3C/path%3E%3C/svg%3E");`,
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // pour cibler le bouton de ràz des input.search
      addVariant('search-reset', '&::-webkit-search-cancel-button');
    }),
  ],
} satisfies Config;
