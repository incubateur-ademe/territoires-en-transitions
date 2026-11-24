import { sortBy } from 'es-toolkit'
import type BigNumber from 'bignumber.js'
import { Result } from 'neverthrow'
import { sum } from '../../domain/big-number.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { toCsvText } from '../to-csv-text.ts'
import { readForestCommunes, type ForestCommune } from './read-forest-source.ts'

type ForestBuild = {
  readonly epciDepartementsCsv: string
  readonly departementsCsv: string
  readonly epciDepartementCount: number
  readonly departementCount: number
  readonly epciDepartementsHectares: string
  readonly departementsHectares: string
}

type ForestArea = { readonly keys: readonly string[]; readonly hectares: BigNumber }

const outputDataset = 'produits-bois'

// Source : data/produits-bois/manifest.json, colonnes de foret-epci-departement.csv
const EPCI_DEPARTEMENTS_COLUMNS = [
  'epci_departement',
  'code_epci',
  'code_departement',
  'forest_hectares',
] as const

// Source : data/produits-bois/manifest.json, colonnes de foret-departement.csv
const DEPARTEMENTS_COLUMNS = ['code_departement', 'forest_hectares'] as const

function sumByKeys({
  communes,
  toKeys,
}: {
  communes: readonly ForestCommune[]
  toKeys: (commune: ForestCommune) => readonly string[]
}): readonly ForestArea[] {
  const areas = communes.reduce((accumulated, commune) => {
    const keys = toKeys(commune)
    const id = keys.join('-')
    const previous = accumulated.get(id)
    const hectares =
      previous === undefined ? commune.hectares : previous.hectares.plus(commune.hectares)
    return accumulated.set(id, { keys, hectares })
  }, new Map<string, ForestArea>())
  return sortBy([...areas.values()], [({ keys }) => keys.join('-')])
}

function totalHectares(areas: readonly ForestArea[]): string {
  return sum(areas.map(({ hectares }) => hectares)).toFixed()
}

function toForestBuild(communes: readonly ForestCommune[]): Result<ForestBuild, InvalidDataset> {
  const dataset = outputDataset
  const epciDepartements = sumByKeys({
    communes: communes.filter(({ epci }) => epci !== ''),
    toKeys: ({ epci, departement }) => [epci, departement],
  })
  const departements = sumByKeys({ communes, toKeys: ({ departement }) => [departement] })
  const epciDepartementRows = epciDepartements.map(({ keys, hectares }) => [
    keys.join('-'),
    ...keys,
    hectares.toFixed(),
  ])
  const departementRows = departements.map(({ keys, hectares }) => [...keys, hectares.toFixed()])
  return Result.combine([
    toCsvText({ dataset, columns: EPCI_DEPARTEMENTS_COLUMNS, rows: epciDepartementRows }),
    toCsvText({ dataset, columns: DEPARTEMENTS_COLUMNS, rows: departementRows }),
  ]).map(([epciDepartementsCsv, departementsCsv]) => ({
    epciDepartementsCsv,
    departementsCsv,
    epciDepartementCount: epciDepartements.length,
    departementCount: departements.length,
    epciDepartementsHectares: totalHectares(epciDepartements),
    departementsHectares: totalHectares(departements),
  }))
}

function buildForestAreas(forestCsv: string): Result<ForestBuild, InvalidDataset> {
  return readForestCommunes(forestCsv).andThen(toForestBuild)
}

export { buildForestAreas }
export type { ForestBuild }
