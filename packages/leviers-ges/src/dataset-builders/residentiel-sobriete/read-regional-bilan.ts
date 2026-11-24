import { sortBy } from 'es-toolkit'
import { Result, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'

type RegionalBilan = {
  readonly regionCode: string
  readonly electricityGwh: string
  readonly naturalGasGwh: string
  readonly petroleumProductsGwh: string
  readonly heatGwh: string
}

const bilanDataset = 'residentiel-sobriete/sources/sdes-bilan-energie-residentiel-2024.csv'

// Source : data/residentiel-sobriete/sources/sdes-bilan-energie-residentiel-2024.csv, ligne « Métropole » (classeur France métropolitaine du SDES) : code 10, total des régions, absent des régions
const NATIONAL_CODE = '10'

function isRegionCode(code: string): boolean {
  return code !== '' && code !== NATIONAL_CODE
}

function toRegionalBilan(
  row: Readonly<Record<string, string>>,
): Result<RegionalBilan | undefined, InvalidDataset> {
  const dataset = bilanDataset
  return requireColumn({ dataset, row, column: 'code' }).andThen((regionCode) => {
    if (!isRegionCode(regionCode)) return ok(undefined)
    return Result.combine([
      requireColumn({ dataset, row, column: 'CR5_electricite_gwh' }),
      requireColumn({ dataset, row, column: 'CR4_gaz_gwh_pci' }),
      requireColumn({ dataset, row, column: 'CR2_produits_petroliers_gwh_pci' }),
      requireColumn({ dataset, row, column: 'CR8_chaleur_commercialisee_gwh' }),
    ]).andThen(([electricity, naturalGas, petroleumProducts, heat]) =>
      Result.combine([
        roundToLoaderPrecision({ dataset, column: 'CR5_electricite_gwh', text: electricity }),
        roundToLoaderPrecision({ dataset, column: 'CR4_gaz_gwh_pci', text: naturalGas }),
        roundToLoaderPrecision({
          dataset,
          column: 'CR2_produits_petroliers_gwh_pci',
          text: petroleumProducts,
        }),
        roundToLoaderPrecision({ dataset, column: 'CR8_chaleur_commercialisee_gwh', text: heat }),
      ]).map(([electricityGwh, naturalGasGwh, petroleumProductsGwh, heatGwh]) => ({
        regionCode,
        electricityGwh,
        naturalGasGwh,
        petroleumProductsGwh,
        heatGwh,
      })),
    )
  })
}

function readRegionalBilan(bilanCsv: string): Result<readonly RegionalBilan[], InvalidDataset> {
  return parseCsvText({ text: bilanCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(bilanDataset))
    .andThen((rows) => Result.combine(rows.map(toRegionalBilan)))
    .map((bilans) =>
      sortBy(
        bilans.filter((bilan): bilan is RegionalBilan => bilan !== undefined),
        [({ regionCode }) => regionCode],
      ),
    )
}

export { readRegionalBilan }
export type { RegionalBilan }
