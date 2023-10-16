/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
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
          1: '#F4F5FD',
          2: '#F0F0FE',
          3: '#E1E1FD',
          4: '#C3C3FB',
          5: '#A5A5F8',
          6: '#8888F6',
          7: '#6A6AF4', // couleur principale
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
        // Couleurs success
        success: {
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
        // Gris
        grey: {
          8: '#666666',
        },
        // Autres couleurs
        'orange-1': '#F28E40',
      },
    },
  },
  plugins: [],
};
