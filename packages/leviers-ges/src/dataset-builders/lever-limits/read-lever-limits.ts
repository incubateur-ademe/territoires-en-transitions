import { takeWhile } from 'es-toolkit'
import type { LeverLimit } from '../../domain/lever-limits.ts'

// Source : choix de conception, non validé : les methodology.md titrent leur section « ## Limites »
const LIMITS_HEADING = '## Limites'

// Source : choix de conception, non validé : une section de methodology.md commence par « ## »
const SECTION_HEADING_PREFIX = '## '

// Source : choix de conception, non validé : une ligne de tableau markdown commence par « | »
const TABLE_ROW_PREFIX = '|'

// Source : choix de conception, non validé : un tableau markdown a une ligne d'en-tête et une ligne de séparation
const TABLE_HEADER_ROW_COUNT = 2

// Source : choix de conception, non validé : deux cellules, sans « | » dans leur texte (vérifié sur les methodology.md)
const TWO_CELLS_ROW = /^\|(.*?)\|(.*)\|$/u

function toLimit(row: string): LeverLimit {
  const [, limit = '', effect = ''] = TWO_CELLS_ROW.exec(row) ?? []
  return { limit: limit.trim(), effect: effect.trim() }
}

function readLeverLimits(methodology: string): readonly LeverLimit[] {
  const lines = methodology.split('\n')
  if (!lines.includes(LIMITS_HEADING)) return []
  const [, ...following] = lines.slice(lines.indexOf(LIMITS_HEADING))
  return takeWhile(following, (line) => !line.startsWith(SECTION_HEADING_PREFIX))
    .filter((line) => line.startsWith(TABLE_ROW_PREFIX))
    .slice(TABLE_HEADER_ROW_COUNT)
    .map(toLimit)
}

export { readLeverLimits }
