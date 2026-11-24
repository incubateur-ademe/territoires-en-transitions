import { readLeverLimits } from './read-lever-limits.ts'

// Source : choix de conception, non validé : l'en-tête du fichier généré
const SOURCE_COMMENT =
  '// Source : tableaux « Limites » des methodology.md de chaque levier, générés par pnpm build:limits ; ne pas modifier à la main'

// Source : choix de conception, non validé : indentation du fichier généré
const INDENTATION = 2

function buildLeverLimitsSource(methodologyByLever: Readonly<Record<string, string>>): string {
  const limitsByLever = Object.fromEntries(
    Object.entries(methodologyByLever).map(([lever, methodology]) => [
      lever,
      readLeverLimits(methodology),
    ]),
  )
  return [
    "import type { LeverId } from './lever-registry.ts'",
    '',
    'type LeverLimit = {',
    '  readonly limit: string',
    '  readonly effect: string',
    '}',
    '',
    SOURCE_COMMENT,
    `const LEVER_LIMITS: Readonly<Record<LeverId, readonly LeverLimit[]>> = ${JSON.stringify(limitsByLever, null, INDENTATION)}`,
    '',
    'export { LEVER_LIMITS }',
    'export type { LeverLimit }',
    '',
  ].join('\n')
}

export { buildLeverLimitsSource }
