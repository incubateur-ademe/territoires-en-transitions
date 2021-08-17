// const postcssNested = require('postcss-nested')
// const tailwindcss = require('tailwindcss')
// const autoprefixer = require('autoprefixer')
// const cssnano = require('cssnano')

// const mode = process.env.FLAVOUR
// const dev = mode === 'development'

// module.exports = {
//   plugins: [
//     postcssNested,
//     tailwindcss: { config: './tailwindcss-config.js' },
//     autoprefixer,
//     !dev &&
//       cssnano({
//         preset: 'default'
//       })
//   ]
// }

module.exports = {
  plugins: {
    tailwindcss: {config: './tailwind.config.js'},
  },
};
