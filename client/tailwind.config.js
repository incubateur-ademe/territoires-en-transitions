module.exports = {
  purge: {
    content: [
      './dist/**/*.html',
    ],
  },
  variants: {
    extend: {
      boxShadow: ['active'],
      backgroundColor: ['active'],
      textColor: ['active'],
    }
  },
  darkMode: false, // or 'media' or 'class'
}
