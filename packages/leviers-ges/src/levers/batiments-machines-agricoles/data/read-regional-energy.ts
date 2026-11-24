import { err, ok, Result } from 'neverthrow'
import {
  missingData,
  type DataRow,
  type DataSource,
  type DataSourceError,
  type InvalidDataset,
  type MissingData,
} from '../../../domain/data-source.ts'
import { gigawattHoursToMegawattHours } from '../../../domain/units.ts'
import { requireNonEmptyColumn, requireQuantityColumn } from '../../../application/require-column.ts'
import type { AgriculturalConsumption } from './agricultural-consumption.ts'

type RegionalEnergy = ReadonlyMap<string, AgriculturalConsumption>

const regionsDataset = 'batiments-machines-agricoles/regions'

function toRegionalEntry(row: DataRow): Result<readonly [string, AgriculturalConsumption], InvalidDataset> {
  const dataset = regionsDataset
  return Result.combine([
    requireNonEmptyColumn({ dataset, row, column: 'code_region' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'electricity_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'natural_gas_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'petroleum_products_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'heat_gwh' }),
  ]).map(
    ([region, electricity, naturalGas, petroleumProducts, heat]) =>
      [
        region,
        {
          electricity: gigawattHoursToMegawattHours(electricity),
          naturalGas: gigawattHoursToMegawattHours(naturalGas),
          petroleumProducts: gigawattHoursToMegawattHours(petroleumProducts),
          heat: gigawattHoursToMegawattHours(heat),
        },
      ] as const,
  )
}

function readRegionalEnergy(dataSource: DataSource): Result<RegionalEnergy, DataSourceError> {
  return dataSource
    .rows(regionsDataset)
    .andThen((rows) => Result.combine(rows.map(toRegionalEntry)))
    .map((entries) => new Map(entries))
}

function findRegionalConsumption({
  regionalEnergy,
  region,
}: {
  regionalEnergy: RegionalEnergy
  region: string
}): Result<AgriculturalConsumption, MissingData> {
  const consumption = regionalEnergy.get(region)
  return consumption === undefined
    ? err(missingData({ dataset: regionsDataset, key: region }))
    : ok(consumption)
}

export { findRegionalConsumption, readRegionalEnergy }
export type { RegionalEnergy }
