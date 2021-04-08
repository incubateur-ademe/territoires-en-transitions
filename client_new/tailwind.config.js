module.exports = {
  purge: {
    mode: 'all',
    content: [
      './src/**/*.html',
      './src/**/*.svelte',
    ],
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      boxShadow: ['active'],
      backgroundColor: ['active', 'hover'],
      textColor: ['active'],
    }
  },
  plugins: [],
}
