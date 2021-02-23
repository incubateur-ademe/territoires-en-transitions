module.exports = {
  purge: {
    content: [
      './dist/**/*.html',
      './../codegen/templates/**/*.j2',
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
