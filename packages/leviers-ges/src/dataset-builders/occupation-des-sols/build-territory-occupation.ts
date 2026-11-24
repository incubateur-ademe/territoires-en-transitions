import { sortBy, unzip, zip } from 'es-toolkit'
import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import { readRows, readValue, sumColumns } from './build-occupation-data.ts'
import { FACTOR_COLUMNS, SURFACE_COLUMNS, type SurfaceOutput } from './occupation-columns.ts'
import { surfacesDataset } from './read-occupation-sources.ts'

type TerritoryKind = 'departement' | 'region'

type TerritoryBuild = {
  readonly surfacesCsv: string
  readonly factorsCsv: string
  readonly territoryCount: number
  readonly surfaceTotals: Readonly<Record<string, string>>
}

type Term = {
  readonly weight: BigNumber
  readonly communeCount: BigNumber
  readonly value: BigNumber
}

type Commune = {
  readonly territory: string
  readonly factorSet: string
  readonly surfaces: readonly BigNumber[]
}

type FactorSetGroup = {
  readonly factorSet: string
  readonly communeCount: BigNumber
  readonly surfaceByOutput: Readonly<Record<SurfaceOutput, BigNumber>>
}

const outputDataset = 'occupation-des-sols'

const factorSetsDataset = 'occupation-des-sols/departements-facteurs'

// Source : data/occupation-des-sols/manifest.json : colonne clé de chaque jeu par territoire
const KEY_COLUMN: Readonly<Record<TerritoryKind, string>> = {
  departement: 'code_departement',
  region: 'code_region',
}

// Source : choix de conception, non validé : quand la surface de pondération du territoire est nulle, chaque commune pèse 1 (moyenne simple)
const EQUAL_WEIGHT = toBig('1')

function toSurfaceRecord(
  entries: readonly (readonly [SurfaceOutput, BigNumber])[],
): Readonly<Record<SurfaceOutput, BigNumber>> {
  return Object.fromEntries(entries) as Record<SurfaceOutput, BigNumber>
}

function readCommunes({
  csv,
  territoryColumn,
}: {
  csv: string
  territoryColumn: TerritoryKind
}): Result<readonly Commune[], InvalidDataset> {
  const dataset = surfacesDataset
  return readRows({ dataset, csv }).andThen((rows) =>
    Result.combine(
      rows.map((row) =>
        Result.combine([
          requireColumn({ dataset, row, column: territoryColumn }),
          requireColumn({ dataset, row, column: 'jeu' }),
          Result.combine(
            SURFACE_COLUMNS.map(({ source }) => readValue({ dataset, row, column: source })),
          ),
        ]).map(([territory, factorSet, surfaces]) => ({ territory, factorSet, surfaces })),
      ),
    ),
  )
}

function readFactorSets(csv: string): Result<ReadonlyMap<string, readonly BigNumber[]>, InvalidDataset> {
  const dataset = factorSetsDataset
  return readRows({ dataset, csv }).andThen((rows) =>
    Result.combine(
      rows.map((row) =>
        Result.combine([
          requireColumn({ dataset, row, column: 'jeu' }),
          Result.combine(
            FACTOR_COLUMNS.map(({ sources }) =>
              Result.combine(sources.map((column) => readValue({ dataset, row, column }))).map(sum),
            ),
          ),
        ]).map(([factorSet, values]) => [factorSet, values] as const),
      ),
    ).map((entries) => new Map(entries)),
  )
}

function toFactorSetGroups(communes: readonly Commune[]): readonly FactorSetGroup[] {
  return [...Map.groupBy(communes, ({ factorSet }) => factorSet)].map(([factorSet, group]) => ({
    factorSet,
    communeCount: sum(group.map(() => EQUAL_WEIGHT)),
    surfaceByOutput: toSurfaceRecord(
      zip(
        SURFACE_COLUMNS.map(({ output }) => output),
        sumColumns(group.map(({ surfaces }) => surfaces)),
      ),
    ),
  }))
}

function toTerms({
  group,
  factorSets,
}: {
  group: FactorSetGroup
  factorSets: ReadonlyMap<string, readonly BigNumber[]>
}): Result<readonly Term[], InvalidDataset> {
  const values = factorSets.get(group.factorSet)
  return values === undefined
    ? err(
        invalidDataset({
          dataset: factorSetsDataset,
          reason: 'missing_key_column',
          detail: group.factorSet,
        }),
      )
    : ok(
        zip(FACTOR_COLUMNS, values).map(([{ weight }, value]) => ({
          weight: group.surfaceByOutput[weight],
          communeCount: group.communeCount,
          value,
        })),
      )
}

function weightedMean({
  column,
  terms,
}: {
  column: string
  terms: readonly Term[]
}): Result<string, InvalidDataset> {
  const totalWeight = sum(terms.map(({ weight }) => weight))
  const weights = terms.map(({ weight, communeCount }) => (totalWeight.isZero() ? communeCount : weight))
  const weightedSum = sum(zip(weights, terms).map(([weight, { value }]) => weight.times(value)))
  return roundToLoaderPrecision({
    dataset: outputDataset,
    column,
    text: weightedSum.dividedBy(sum(weights)).toFixed(),
  })
}

function buildTerritoryOccupation({
  surfacesCsv,
  factorSetsCsv,
  territoryKind,
}: {
  surfacesCsv: string
  factorSetsCsv: string
  territoryKind: TerritoryKind
}): Result<TerritoryBuild, InvalidDataset> {
  const keyColumn = KEY_COLUMN[territoryKind]
  return Result.combine([
    readCommunes({ csv: surfacesCsv, territoryColumn: territoryKind }),
    readFactorSets(factorSetsCsv),
  ]).andThen(([communes, factorSets]) => {
    const territories = sortBy(
      [...Map.groupBy(communes, ({ territory }) => territory)].filter(([territory]) => territory !== ''),
      [([territory]) => territory],
    )
    const surfaceRows = territories.map(([territory, group]) => [
      territory,
      ...sumColumns(group.map(({ surfaces }) => surfaces)).map((total) => total.toFixed()),
    ])
    return Result.combine(
      territories.map(([territory, group]) =>
        Result.combine(toFactorSetGroups(group).map((setGroup) => toTerms({ group: setGroup, factorSets }))).andThen((termsByCommune) =>
          Result.combine(
            zip(FACTOR_COLUMNS, unzip(termsByCommune.map((terms) => [...terms]))).map(([{ output }, terms]) =>
              weightedMean({ column: output, terms }),
            ),
          ).map((factors) => [territory, ...factors]),
        ),
      ),
    ).andThen((factorRows) =>
      Result.combine([
        toCsvText({
          dataset: outputDataset,
          columns: [keyColumn, ...SURFACE_COLUMNS.map(({ output }) => output)],
          rows: surfaceRows,
        }),
        toCsvText({
          dataset: outputDataset,
          columns: [keyColumn, ...FACTOR_COLUMNS.map(({ output }) => output)],
          rows: factorRows,
        }),
      ]).map(([surfaces, factors]) => ({
        surfacesCsv: surfaces,
        factorsCsv: factors,
        territoryCount: territories.length,
        surfaceTotals: Object.fromEntries(
          zip(
            SURFACE_COLUMNS.map(({ output }) => output),
            sumColumns(surfaceRows.map((row) => row.slice(1).map(toBig))).map((total) => total.toFixed()),
          ),
        ),
      })),
    )
  })
}

export { buildTerritoryOccupation }
export type { TerritoryBuild, TerritoryKind }
