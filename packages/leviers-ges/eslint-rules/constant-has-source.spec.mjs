import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'
import constantHasSource from './constant-has-source.mjs'

RuleTester.describe = describe
RuleTester.it = it

const ruleTester = new RuleTester({ languageOptions: { ecmaVersion: 2024, sourceType: 'module' } })

const missingSource = (name) => ({ messageId: 'missingSource', data: { name } })

ruleTester.run('constant-has-source', constantHasSource, {
  valid: [
    { code: '// Source : tableur ADEME\nconst FACTOR = 1' },
    { code: '// Source : tableur ADEME\nexport const FACTOR = 1' },
    { code: '// Source : tableur ADEME,\n// onglet Haies\nconst FACTOR = 1' },
    { code: '// Autre commentaire\n// Source : tableur ADEME\nconst FACTOR = 1' },
    { code: 'function compute() {\n  // Source : tableur ADEME\n  const FACTOR = 1\n  return FACTOR\n}' },
    { code: 'const factor = 1' },
    { code: 'let FACTOR = 1' },
    { code: 'const { FACTOR } = values' },
    { code: 'const Big = createBig()' },
    { code: '// Source : tableur ADEME\nconst FIRST = 1, SECOND = 2' },
    { code: 'for (const ITEM of items) {\n  use(ITEM)\n}' },
    { code: 'for (const KEY in values) {\n  use(KEY)\n}' },
    { code: 'for (const START = 0; START < 1; ) {\n  use(START)\n}' },
    { code: '// Source : tableur ADEME\nexport const FIRST = 1, SECOND = 2' },
    { code: '// Source : tableur ADEME\n/* note */\nconst FACTOR = 1' },
  ],
  invalid: [
    { code: 'const FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: 'export const FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: '// Autre commentaire\nconst FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: '/* Source : tableur */\nconst FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: '// Source : tableur\n\nconst FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: '// Source : tableur\n\nexport const FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: '/** Source : tableur */\nconst FACTOR = 1', errors: [missingSource('FACTOR')] },
    { code: '//Source : tableur\nconst FACTOR = 1', errors: [missingSource('FACTOR')] },
    {
      code: 'export const FIRST = 1, SECOND = 2',
      errors: [missingSource('FIRST'), missingSource('SECOND')],
    },
    {
      code: '// Source : tableur\n// suite\n\n// autre\nconst FACTOR = 1',
      errors: [missingSource('FACTOR')],
    },
    {
      code: 'function compute() {\n  const FACTOR = 1\n  return FACTOR\n}',
      errors: [missingSource('FACTOR')],
    },
    {
      code: 'const FIRST = 1, SECOND = 2',
      errors: [missingSource('FIRST'), missingSource('SECOND')],
    },
  ],
})
