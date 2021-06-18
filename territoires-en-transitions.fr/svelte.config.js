import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import purgecss from '@fullhuman/postcss-purgecss';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  extensions: ['.svelte', '.md'],
  preprocess: preprocess({
    postcss: {
      plugins: [
        purgecss({
          content: ['src/**/*.svelte', 'src/app.html'],
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
      pages: ['/'],
      crawl: false
    },
    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte'
  }
};

export default config;
