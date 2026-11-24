import { sortBy, unzip, zip } from 'es-toolkit'
import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import { FACTOR_COLUMNS, SURFACE_COLUMNS } from './occupation-columns.ts'
import {
  factorsDataset,
  surfacesDataset,
  type OccupationSources,
} from './read-occupation-sources.ts'

type OccupationBuild = {
  readonly surfacesCsv: string
  readonly factorsCsv: string
  readonly epciCount: number
  readonly surfaceTotals: Readonly<Record<string, string>>
}

type EpciValues = { readonly epci: string; readonly values: readonly BigNumber[] }

const outputDataset = 'occupation-des-sols'

function readValue({
  dataset,
  row,
  column,
}: {
  dataset: string
  row: DataRow
  column: string
}): Result<BigNumber, InvalidDataset> {
  return requireColumn({ dataset, row, column })
    .andThen((text) => roundToLoaderPrecision({ dataset, column, text }))
    .map(toBig)
}

function readRows({
  dataset,
  csv,
}: {
  dataset: string
  csv: string
}): Result<readonly DataRow[], InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' }).mapErr(toInvalidDataset(dataset))
}

function readSurfaces(csv: string): Result<readonly EpciValues[], InvalidDataset> {
  const dataset = surfacesDataset
  return readRows({ dataset, csv })
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'epci' }),
            Result.combine(
              SURFACE_COLUMNS.map(({ source }) => readValue({ dataset, row, column: source })),
            ),
          ]).map(([epci, values]) => ({ epci, values })),
        ),
      ),
    )
    .map((communes) => communes.filter(({ epci }) => epci !== ''))
}

function sumColumns(rows: readonly (readonly BigNumber[])[]): readonly BigNumber[] {
  return unzip(rows.map((row) => [...row])).map(sum)
}

function sumByEpci(communes: readonly EpciValues[]): readonly EpciValues[] {
  const grouped = Map.groupBy(communes, ({ epci }) => epci)
  const epcis = [...grouped].map(([epci, group]) => ({
    epci,
    values: sumColumns(group.map(({ values }) => values)),
  }))
  return sortBy(epcis, [({ epci }) => epci])
}

function readFactors(csv: string): Result<readonly EpciValues[], InvalidDataset> {
  const dataset = factorsDataset
  return readRows({ dataset, csv }).andThen((rows) =>
    Result.combine(
      rows.map((row) =>
        Result.combine([
          requireColumn({ dataset, row, column: 'insee' }),
          Result.combine(
            FACTOR_COLUMNS.map(({ sources }) =>
              Result.combine(sources.map((column) => readValue({ dataset, row, column }))).map(sum),
            ),
          ),
        ]).map(([epci, values]) => ({ epci, values })),
      ),
    ).map((epcis) => sortBy(epcis, [({ epci }) => epci])),
  )
}

function toRows(epcis: readonly EpciValues[]): readonly (readonly string[])[] {
  return epcis.map(({ epci, values }) => [epci, ...values.map((value) => value.toFixed())])
}

function toSurfaceTotals(epcis: readonly EpciValues[]): Readonly<Record<string, string>> {
  const totals = sumColumns(epcis.map(({ values }) => values)).map((total) => total.toFixed())
  return Object.fromEntries(
    zip(
      SURFACE_COLUMNS.map(({ output }) => output),
      totals,
    ),
  )
}

function requireEpcis(surfaces: readonly EpciValues[]): Result<readonly EpciValues[], InvalidDataset> {
  return surfaces.length === 0
    ? err(
        invalidDataset({
          dataset: surfacesDataset,
          reason: 'empty_dataset',
          detail: 'no commune with an EPCI',
        }),
      )
    : ok(surfaces)
}

function buildOccupationData({
  surfacesCsv,
  factorsCsv,
}: Pick<OccupationSources, 'surfacesCsv' | 'factorsCsv'>): Result<OccupationBuild, InvalidDataset> {
  const dataset = outputDataset
  return Result.combine([readSurfaces(surfacesCsv).map(sumByEpci).andThen(requireEpcis), readFactors(factorsCsv)]).andThen(
    ([surfaces, factors]) =>
      Result.combine([
        toCsvText({
          dataset,
          columns: ['code_epci', ...SURFACE_COLUMNS.map(({ output }) => output)],
          rows: toRows(surfaces),
        }),
        toCsvText({
          dataset,
          columns: ['code_epci', ...FACTOR_COLUMNS.map(({ output }) => output)],
          rows: toRows(factors),
        }),
      ]).map(([surfacesOutput, factorsOutput]) => ({
        surfacesCsv: surfacesOutput,
        factorsCsv: factorsOutput,
        epciCount: surfaces.length,
        surfaceTotals: toSurfaceTotals(surfaces),
      })),
  )
}

export { buildOccupationData, readRows, readValue, sumColumns }
export type { OccupationBuild }
