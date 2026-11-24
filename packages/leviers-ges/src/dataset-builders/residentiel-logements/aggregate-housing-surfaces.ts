import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { parseBigWithExponent, sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import {
  HEATING_VECTOR_BY_FUEL_CODE,
  HOUSING_COLUMNS,
  SURFACE_SQUARE_METRES_BY_CLASS,
  toConstructionPeriod,
  toHousingColumn,
  toHousingType,
} from './housing-cells.ts'
import { readTerritories } from './read-territories.ts'

type HousingSurfaces = {
  readonly csv: string
  readonly communeCount: number
  readonly unmatchedCommuneCount: number
  readonly unmatchedDwellings: string
  readonly dwellings: string
  readonly squareMetres: string
}

type ColumnIndexes = Readonly<Record<'COMMUNE' | 'ACHL' | 'CMBL' | 'HLML' | 'IPONDL' | 'SURF' | 'TYPL', number>>

type Weighted = {
  readonly commune: string
  readonly column: string
  readonly midpoint: BigNumber
  readonly weight: BigNumber
}

type CommuneSurfaces = {
  readonly commune: string
  readonly dwellings: BigNumber
  readonly cells: ReadonlyMap<string, BigNumber>
}

// Source : choix de conception de ce dépôt, sans source externe : valeur d'une somme vide, non validé
const NO_SQUARE_METRES = toBig('0')

const dataset = 'residentiel-logements/sources/insee-rp2022-logements-communes.csv'

// Source : data/residentiel-logements/manifest.json, colonnes de logements-departement.csv précédées de la commune, de l'EPCI et du département
const COMMUNE_COLUMNS = ['commune', 'epci', 'departement', ...HOUSING_COLUMNS] as const

// Source : choix de conception de ce dépôt : séparateur de la clé commune, colonne et classe de superficie, absent des codes INSEE
const KEY_SEPARATOR = '\t'

function toColumnIndexes(header: string): Result<ColumnIndexes, InvalidDataset> {
  const names = header.split(';')
  const indexes: ColumnIndexes = {
    COMMUNE: names.indexOf('COMMUNE'),
    ACHL: names.indexOf('ACHL'),
    CMBL: names.indexOf('CMBL'),
    HLML: names.indexOf('HLML'),
    IPONDL: names.indexOf('IPONDL'),
    SURF: names.indexOf('SURF'),
    TYPL: names.indexOf('TYPL'),
  }
  const missing = Object.entries(indexes).find(([, index]) => index < 0)
  return missing === undefined
    ? ok(indexes)
    : err(
        invalidDataset({
          dataset,
          reason: 'missing_key_column',
          detail: `${missing[0]} is not in the header`,
        }),
      )
}

function addLine({
  line,
  columns,
  weights,
}: {
  line: string
  columns: ColumnIndexes
  weights: Map<string, Weighted>
}): Result<void, InvalidDataset> {
  const fields = line.split(';')
  const field = (column: keyof ColumnIndexes) => (fields[columns[column]] ?? '').trim()
  const vector = HEATING_VECTOR_BY_FUEL_CODE[field('CMBL')]
  const type = toHousingType({ typeCode: field('TYPL'), landlordCode: field('HLML') })
  const period = toConstructionPeriod(field('ACHL'))
  const squareMetres = SURFACE_SQUARE_METRES_BY_CLASS[field('SURF')]
  if (
    vector === undefined ||
    type === undefined ||
    period === undefined ||
    squareMetres === undefined
  )
    return ok(undefined)
  const commune = field('COMMUNE')
  const column = toHousingColumn({ type, vector, period })
  const key = [commune, column, squareMetres].join(KEY_SEPARATOR)
  return parseBigWithExponent(field('IPONDL'))
    .mapErr(() =>
      invalidDataset({
        dataset,
        reason: 'unreadable',
        detail: `IPONDL=${field('IPONDL')} is not a decimal number`,
      }),
    )
    .map((weight) => {
      const previous = weights.get(key)
      weights.set(key, {
        commune,
        column,
        midpoint: toBig(squareMetres),
        weight: previous === undefined ? weight : previous.weight.plus(weight),
      })
    })
}

async function sumWeights(
  lines: AsyncIterable<string>,
): Promise<Result<readonly Weighted[], InvalidDataset>> {
  const iterator = lines[Symbol.asyncIterator]()
  const header = await iterator.next()
  if (header.done === true)
    return err(invalidDataset({ dataset, reason: 'missing_key_column', detail: 'empty file' }))
  const columns = toColumnIndexes(header.value)
  if (columns.isErr()) return err(columns.error)
  const weights = new Map<string, Weighted>()
  for await (const line of { [Symbol.asyncIterator]: () => iterator }) {
    const added = addLine({ line, columns: columns.value, weights })
    if (added.isErr()) return err(added.error)
  }
  return ok([...weights.values()])
}

function toCommuneSurfaces(weighted: readonly Weighted[]): readonly CommuneSurfaces[] {
  const communes = weighted.reduce((byCommune, { commune, column, midpoint, weight }) => {
    const previous = byCommune.get(commune)
    const cells = new Map(previous?.cells)
    const surface = weight.times(midpoint)
    cells.set(column, (cells.get(column) ?? NO_SQUARE_METRES).plus(surface))
    return byCommune.set(commune, {
      commune,
      dwellings: (previous?.dwellings ?? NO_SQUARE_METRES).plus(weight),
      cells,
    })
  }, new Map<string, CommuneSurfaces>())
  return [...communes.values()].sort((first, second) => first.commune.localeCompare(second.commune))
}

function toRoundedCells(cells: ReadonlyMap<string, BigNumber>): Result<readonly string[], InvalidDataset> {
  return Result.combine(
    HOUSING_COLUMNS.map((column) =>
      roundToLoaderPrecision({
        dataset,
        column,
        text: (cells.get(column) ?? NO_SQUARE_METRES).toFixed(),
      }),
    ),
  )
}

function totalSquareMetres(communes: readonly CommuneSurfaces[]): string {
  return sum(communes.flatMap(({ cells }) => [...cells.values()])).toFixed()
}

function totalDwellings(communes: readonly CommuneSurfaces[]): string {
  return sum(communes.map(({ dwellings }) => dwellings)).toFixed()
}

function toHousingSurfaces({
  communes,
  territories,
}: {
  communes: readonly CommuneSurfaces[]
  territories: ReadonlyMap<string, readonly [string, string]>
}): Result<HousingSurfaces, InvalidDataset> {
  const matched = communes.flatMap((surfaces) => {
    const territory = territories.get(surfaces.commune)
    return territory === undefined ? [] : [{ ...surfaces, territory }]
  })
  const unmatched = communes.filter(({ commune }) => !territories.has(commune))
  return Result.combine(
    matched.map(({ commune, cells, territory }) =>
      toRoundedCells(cells).map((rounded) => [commune, ...territory, ...rounded]),
    ),
  ).andThen((rows) =>
    toCsvText({ dataset, columns: COMMUNE_COLUMNS, rows }).map((csv) => ({
      csv,
      communeCount: matched.length,
      unmatchedCommuneCount: unmatched.length,
      unmatchedDwellings: totalDwellings(unmatched),
      dwellings: totalDwellings(matched),
      squareMetres: totalSquareMetres(matched),
    })),
  )
}

async function aggregateHousingSurfaces({
  lines,
  communesCsv,
}: {
  lines: AsyncIterable<string>
  communesCsv: string
}): Promise<Result<HousingSurfaces, InvalidDataset>> {
  const weighted = await sumWeights(lines)
  return Result.combine([weighted.map(toCommuneSurfaces), readTerritories(communesCsv)]).andThen(
    ([communes, territories]) => toHousingSurfaces({ communes, territories }),
  )
}

export { aggregateHousingSurfaces }
export type { HousingSurfaces }
