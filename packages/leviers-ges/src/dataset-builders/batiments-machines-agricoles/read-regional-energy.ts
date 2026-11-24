import { Result, err, ok } from 'neverthrow'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import type { SheetRows } from '../sheet-rows.ts'

type RegionalEnergy = {
  readonly regionCode: string
  readonly electricityGwh: string
  readonly naturalGasGwh: string
  readonly petroleumProductsGwh: string
  readonly heatGwh: string
}

// Source : SDES, données régionales de production et de consommation finale d'énergie, classeur d'une région, secteur agriculture/sylviculture/pêche en GWh : CA2 produits pétroliers, CA4 gaz naturel (CA3 × 0,9, soit PCI), CA5 électricité, CA8 chaleur commercialisée
const AGRICULTURE_LINES = {
  petroleumProducts: 'CA2',
  naturalGas: 'CA4',
  electricity: 'CA5',
  heat: 'CA8',
} as const

// Source : SDES, classeur régional : la colonne C (index 2) porte l'unité de chaque ligne
const UNIT_COLUMN = 2

// Source : SDES, classeur régional : CA2, CA4, CA5 et CA8 sont en GWh ; CA3, le gaz avant passage en PCI, est en GWh PCS
const LINE_UNIT = 'GWh'

function toMismatch({ dataset, detail }: { dataset: string; detail: string }): InvalidDataset {
  return invalidDataset({ dataset, reason: 'columns_mismatch', detail })
}

function readRegionCode({
  dataset,
  rows,
}: {
  dataset: string
  rows: SheetRows
}): Result<string, InvalidDataset> {
  const code = rows[0]?.[0]
  return typeof code === 'string'
    ? ok(code)
    : err(toMismatch({ dataset, detail: 'region code in the first cell' }))
}

function findYearColumn({
  dataset,
  rows,
  year,
}: {
  dataset: string
  rows: SheetRows
  year: string
}): Result<number, InvalidDataset> {
  const column = rows.map((row) => row.indexOf(year)).find((index) => index >= 0)
  return column === undefined ? err(toMismatch({ dataset, detail: `year ${year}` })) : ok(column)
}

function readLine({
  dataset,
  rows,
  line,
  yearColumn,
}: {
  dataset: string
  rows: SheetRows
  line: string
  yearColumn: number
}): Result<string, InvalidDataset> {
  const lineRow = rows.find((row) => row[0] === line)
  if (lineRow === undefined) return err(toMismatch({ dataset, detail: `line ${line}` }))
  if (lineRow[UNIT_COLUMN] !== LINE_UNIT) {
    return err(toMismatch({ dataset, detail: `unit of line ${line}` }))
  }
  const cell = lineRow[yearColumn]
  return typeof cell === 'string'
    ? roundToLoaderPrecision({ dataset, column: line, text: cell })
    : err(toMismatch({ dataset, detail: `line ${line}` }))
}

function readRegionalEnergy({
  dataset,
  rows,
  year,
}: {
  dataset: string
  rows: SheetRows
  year: string
}): Result<RegionalEnergy, InvalidDataset> {
  return Result.combine([
    readRegionCode({ dataset, rows }),
    findYearColumn({ dataset, rows, year }),
  ]).andThen(([regionCode, yearColumn]) =>
    Result.combine([
      readLine({ dataset, rows, line: AGRICULTURE_LINES.electricity, yearColumn }),
      readLine({ dataset, rows, line: AGRICULTURE_LINES.naturalGas, yearColumn }),
      readLine({ dataset, rows, line: AGRICULTURE_LINES.petroleumProducts, yearColumn }),
      readLine({ dataset, rows, line: AGRICULTURE_LINES.heat, yearColumn }),
    ]).map(([electricityGwh, naturalGasGwh, petroleumProductsGwh, heatGwh]) => ({
      regionCode,
      electricityGwh,
      naturalGasGwh,
      petroleumProductsGwh,
      heatGwh,
    })),
  )
}

export { readRegionalEnergy }
export type { RegionalEnergy }
