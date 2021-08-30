module.exports = {
  style: 'jit',
  purge: {
    content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    safelist: ['ml-0', 'ml-20', 'ml-40', 'ml-60'],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        // Misc
        beige: '#f9f8f6',
        // Design system
        bf500: '#000091',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
