const sourceLevels = ['REG', 'DEP', 'EPCI'] as const

type SourceLevel = (typeof sourceLevels)[number]

// Source : sources/personnes de la fiche d'analyse 11 : l'Insee et le SDES rangent les trajets hors du champ (étranger, commune inconnue) sous les codes 99 (région), 999 (département), ZZZZZZZZZ et 999999999 (EPCI) ; 999999999 porte les trajets du code 999 côté travail
const OUT_OF_SCOPE_CODES: Readonly<Record<SourceLevel, readonly string[]>> = {
  REG: ['99'],
  DEP: ['999'],
  EPCI: ['ZZZZZZZZZ', '999999999'],
}

function isInScope({ level, code }: { level: SourceLevel; code: string }): boolean {
  return !OUT_OF_SCOPE_CODES[level].includes(code)
}

function toTerritoryKey({ level, code }: { level: SourceLevel; code: string }): string {
  return `${level}|${code}`
}

export { isInScope, sourceLevels, toTerritoryKey }
export type { SourceLevel }
