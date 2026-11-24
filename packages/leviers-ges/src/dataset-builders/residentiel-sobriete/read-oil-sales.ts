import { Result, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import type { DataRow, InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'

type OilSales = {
  readonly departementCode: string
  readonly regionCode: string
  readonly fuelOil: string
  readonly liquefiedPetroleumGas: string
}

const salesDataset = 'residentiel-sobriete/sources/sdes-ventes-produits-petroliers-departement.csv'

// Source : SDES, ventes de produits pétroliers par département : année de la colonne ANNEE retenue, celle du bilan énergétique
const REFERENCE_YEAR = '2024'

function toOilSales(row: DataRow): Result<OilSales | undefined, InvalidDataset> {
  const dataset = salesDataset
  return requireColumn({ dataset, row, column: 'ANNEE' }).andThen((year) => {
    if (year !== REFERENCE_YEAR) return ok(undefined)
    return Result.combine([
      requireColumn({ dataset, row, column: 'DEPARTEMENT_CODE' }),
      requireColumn({ dataset, row, column: 'REGION_CODE' }),
      requireColumn({ dataset, row, column: 'FOD' }).andThen((text) =>
        roundToLoaderPrecision({ dataset, column: 'FOD', text }),
      ),
      requireColumn({ dataset, row, column: 'GPL' }).andThen((text) =>
        roundToLoaderPrecision({ dataset, column: 'GPL', text }),
      ),
    ]).map(([departementCode, regionCode, fuelOil, liquefiedPetroleumGas]) => ({
      departementCode,
      regionCode,
      fuelOil,
      liquefiedPetroleumGas,
    }))
  })
}

function readOilSales(salesCsv: string): Result<readonly OilSales[], InvalidDataset> {
  return parseCsvText({ text: salesCsv, delimiter: ';' })
    .mapErr(toInvalidDataset(salesDataset))
    .andThen((rows) => Result.combine(rows.map(toOilSales)))
    .map((sales) => sales.filter((sale): sale is OilSales => sale !== undefined))
}

export { readOilSales }
export type { OilSales }
