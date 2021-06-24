import marked from 'marked'
import frontMatter from 'front-matter'

export default function (pluginOptions = {}) {
  return {
    name: 'vite-import-markdown',
    config() {
      marked.setOptions(pluginOptions)
    },
    transform(src, id) {
      if (!id.endsWith('.md')) return null

      const {attributes, body} = frontMatter(src)
      let result = {
        ...attributes,
        content: body
      }

      return {
        code: `export default ${JSON.stringify(result)}`,
        map: null
      }
    }
  }
}
