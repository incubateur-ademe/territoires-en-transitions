import { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/** Configuration Tailwind */
export const preset = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    maxHeight: { '80vh': '80vh' },
    extend: {
      fontFamily: {
        sans: ['Marianne', 'arial', 'sans-serif'],
      },
      colors: {
        // Anciennes couleurs, à modifier avec l'harmonisation
        // des composants entre app et site
        //
        // Design system
        bf500: '#000091',
        // En rapport avec la dernière version Figma du DSFR
        // nomenclature Figma: light/text/default-info
        // nomenclature tailwind proposée: t = text -> tDefaultInfo
        grey425: '#666',
        grey975: '#F6F6F6',

        //
        // Nouvelles couleurs
        // Déclinaisons couleur principale
        primary: {
          0: '#FBFCFE',
          1: '#F4F5FD',
          2: '#F0F0FE',
          3: '#E1E1FD',
          4: '#C3C3FB',
          5: '#A5A5F8',
          6: '#8888F6',
          DEFAULT: '#6A6AF4', // couleur principale
          7: '#6A6AF4',
          8: '#5555C3',
          9: '#404092',
          10: '#2A2A62',
          11: '#151531',
        },
        // Couleurs secondaires
        secondary: {
          1: '#F4C447',
          2: '#FFE4A8',
        },
        // Couleurs new
        new: {
          1: '#B88729',
          2: '#FFE8BD',
        },
        // Couleurs success
        success: {
          DEFAULT: '#48A775',
          1: '#48A775',
          2: '#E4FCEF',
          3: '#3AD483',
        },
        // Couleurs error
        error: {
          1: '#F55B5B',
          2: '#FFD8D8',
          3: '#FF9789',
        },
        // Couleurs warning
        warning: {
          1: '#FFA903',
          2: '#FFF5DF',
          3: '#FBC55C',
        },
        // Couleurs info
        info: {
          1: '#4380F5',
          2: '#EEF4FF',
          3: '#91B2EE',
        },
        // Gris
        grey: {
          1: '#FDFDFD',
          2: '#F9F9F9',
          3: '#EEEEEE',
          4: '#DDDDDD',
          5: '#CECECE',
          6: '#929292',
          7: '#8A8A8A',
          8: '#666666',
          9: '#535252',
          10: '#161616',
        },
        // Autres couleurs
        'orange-1': '#F28E40',
        // Couleur de fond pour les modales ou panneaux latéraux
        overlay: 'hsla(240, 40%, 27%, 0.5)',
      },
      /* Preset utilisé pour conserver les mêmes size / weight de police dans les graphes */
      /* Il aurait été préférable d'avoir un hook useTheme pour récupérer ces valeurs mais pas trouvé pour tailwind */
      fontSize: {
        xs: '0.75rem', // 12px
        sm: '0.875rem', // 14px
        base: '1rem', // 16px
        lg: '1.125rem', // 18px
        xl: '1.25rem', // 20px
        '2xl': '1.5rem', // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem', // 48px
        '6xl': '3.75rem', // 60px
        '7xl': '4.5rem', // 72px
        '8xl': '6rem', // 96px
        '9xl': '8rem', // 128px
      },
      fontWeight: {
        thin: '100',
        extralight: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      boxShadow: {
        // ombre pour certains types de boutons (Tab)
        button: '0 2px 4px 0 rgba(0,0,0,0.05)',
        card: '2px 2px 10px 0 rgba(233, 233, 233, 0.9)',
        't-sm': '0 -1px 2px 0 rgba(0, 0, 0, 0.05)',
        't-md':
          '0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        't-lg':
          '0 -10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        't-xl':
          '0 -20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        't-2xl': '0 -25px 50px -12px rgba(0, 0, 0, 0.25)',
        't-3xl': '0 -35px 60px -15px rgba(0, 0, 0, 0.3)',
      },
      screens: {
        '2xl': '1440px',
      },
      maxWidth: {
        '8xl': '90rem',
      },
      zIndex: {
        modal: '1000',
        dropdown: '999',
        tooltip: '1001',
      },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
      },
      backgroundImage: {
        // malheureusement on n'arrive pas à styler le bouton de ràz des input.search directement avec remixicon
        // ni à exporter correctement des svg définis localement dans le package ui
        // pour contourner le pb on utilise une image de fond définie par une "data-url"
        // TODO: à supprimer si on trouve une meilleure solution
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
