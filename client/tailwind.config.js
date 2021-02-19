module.exports = {
  purge: {
    content: [
      './dist/**/*.html',
    ],
  },
  variants: {
    extend: {
      boxShadow: ['active'],
      backgroundColor: ['active', 'hover'],
      textColor: ['active'],
    }
  },
  darkMode: false, // or 'media' or 'class'
}
