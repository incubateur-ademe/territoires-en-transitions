import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import purgecss from '@fullhuman/postcss-purgecss';
import markdownImport from './src/transform/MarkdownImport.mjs';
import path from 'path'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  extensions: ['.svelte'],
  preprocess: preprocess({
    postcss: {
      plugins: [
        purgecss({
          content: ['src/**/*.svelte', 'src/app.html', '../components/**/*.svelte'],
          safelist: ['body']
          // rejected: true,
        })
      ]
    }
  }),

  kit: {
    adapter: adapter(),
    hydrate: false,
    router: false,
    prerender: {
      // workaround issue 1588 by still having prerendering happen with smallest scope possible
      // enabled: false
      pages: ['/', '/mentions-legales'],
      crawl: false
    },
    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte',
    vite: {
      plugins: [markdownImport({})],
      resolve: {
        alias: {
          $components: path.resolve('./../components')
        }
      }
    }
  },

};

export default config;
