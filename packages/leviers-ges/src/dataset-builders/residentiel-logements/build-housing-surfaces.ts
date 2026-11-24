import { sortBy } from 'es-toolkit'
import type BigNumber from 'bignumber.js'
import { Result } from 'neverthrow'
import { sum } from '../../domain/big-number.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { toCsvText } from '../to-csv-text.ts'
import { HOUSING_COLUMNS, toHousingRecord, type HousingColumn } from './housing-cells.ts'
import { readHousingCommunes, type HousingCommune } from './read-housing-source.ts'

type HousingBuild = {
  readonly epciDepartementsCsv: string
  readonly departementsCsv: string
  readonly epciDepartementCount: number
  readonly departementCount: number
  readonly epciDepartementsSquareMetres: string
  readonly departementsSquareMetres: string
}

type HousingArea = {
  readonly keys: readonly string[]
  readonly squareMetres: Readonly<Record<HousingColumn, BigNumber>>
}

const epciDepartementsDataset = 'residentiel-logements/logements-epci-departement.csv'

const departementsDataset = 'residentiel-logements/logements-departement.csv'

// Source : data/residentiel-logements/manifest.json, colonnes de logements-epci-departement.csv
const EPCI_DEPARTEMENTS_COLUMNS = [
  'epci_departement',
  'code_epci',
  'code_departement',
  ...HOUSING_COLUMNS,
] as const

// Source : data/residentiel-logements/manifest.json, colonnes de logements-departement.csv
const DEPARTEMENTS_COLUMNS = ['code_departement', ...HOUSING_COLUMNS] as const

function sumByKeys({
  communes,
  toKeys,
}: {
  communes: readonly HousingCommune[]
  toKeys: (commune: HousingCommune) => readonly string[]
}): readonly HousingArea[] {
  const areas = communes.reduce((accumulated, commune) => {
    const keys = toKeys(commune)
    const id = keys.join('-')
    const previous = accumulated.get(id)
    const squareMetres =
      previous === undefined
        ? commune.squareMetres
        : toHousingRecord(
            HOUSING_COLUMNS.map((column) => [
              column,
              previous.squareMetres[column].plus(commune.squareMetres[column]),
            ]),
          )
    return accumulated.set(id, { keys, squareMetres })
  }, new Map<string, HousingArea>())
  return sortBy([...areas.values()], [({ keys }) => keys.join('-')])
}

function totalSquareMetres(areas: readonly HousingArea[]): string {
  return sum(
    areas.flatMap(({ squareMetres }) => HOUSING_COLUMNS.map((column) => squareMetres[column])),
  ).toFixed()
}

function toHousingBuild(communes: readonly HousingCommune[]): Result<HousingBuild, InvalidDataset> {
  const epciDepartements = sumByKeys({
    communes: communes.filter(({ epci }) => epci !== ''),
    toKeys: ({ epci, departement }) => [epci, departement],
  })
  const departements = sumByKeys({ communes, toKeys: ({ departement }) => [departement] })
  const epciDepartementRows = epciDepartements.map(({ keys, squareMetres }) => [
    keys.join('-'),
    ...keys,
    ...HOUSING_COLUMNS.map((column) => squareMetres[column].toFixed()),
  ])
  const departementRows = departements.map(({ keys, squareMetres }) => [
    ...keys,
    ...HOUSING_COLUMNS.map((column) => squareMetres[column].toFixed()),
  ])
  return Result.combine([
    toCsvText({ dataset: epciDepartementsDataset, columns: EPCI_DEPARTEMENTS_COLUMNS, rows: epciDepartementRows }),
    toCsvText({ dataset: departementsDataset, columns: DEPARTEMENTS_COLUMNS, rows: departementRows }),
  ]).map(([epciDepartementsCsv, departementsCsv]) => ({
    epciDepartementsCsv,
    departementsCsv,
    epciDepartementCount: epciDepartements.length,
    departementCount: departements.length,
    epciDepartementsSquareMetres: totalSquareMetres(epciDepartements),
    departementsSquareMetres: totalSquareMetres(departements),
  }))
}

function buildHousingSurfaces(housingCsv: string): Result<HousingBuild, InvalidDataset> {
  return readHousingCommunes(housingCsv).andThen(toHousingBuild)
}

export { buildHousingSurfaces }
export type { HousingBuild }
