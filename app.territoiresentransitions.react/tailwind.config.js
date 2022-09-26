module.exports = {
  mode: 'jit',
  style: 'jit',
  purge: {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    safelist: ['ml-0', 'ml-20', 'ml-40', 'ml-60'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    maxHeight: {
      '80vh': '80vh',
    },
    extend: {
      colors: {
        // Misc
        beige: '#f9f8f6',
        // Design system
        bf500: '#000091',
        bf525: '#6A6AF4',
        // En rapport avec la dernière version Figma du DSFR
        // nomenclature Figma: light/text/default-info
        // nomenclature tailwind proposée: t = text -> tDefaultInfo
        tDefaultInfo: '#0063CB',
        bf925: '#E3E3FD',
        bf975: '#f5f5fe',
        grey425: '#666',
        grey625: '#929292',
        grey925: '#E5E5E5',
        grey975: '#F6F6F6',
        error425: '#CE0500',
      },
    },
  },
  variants: {
    extend: {},
  },
  // eslint-disable-next-line node/no-unpublished-require
  plugins: [require('@tailwindcss/line-clamp')],
};
