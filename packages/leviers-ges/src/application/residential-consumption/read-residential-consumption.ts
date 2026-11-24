import { Result } from 'neverthrow'
import { match } from 'ts-pattern'
import { requireQuantityColumn } from '../require-column.ts'
import type {
  DataRow,
  DataSource,
  DataSourceError,
  InvalidDataset,
} from '../../domain/data-source.ts'
import { sum } from '../../domain/big-number.ts'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import type { Level, Territory } from '../../domain/territory.ts'
import { gigawattHoursToMegawattHours, quantity } from '../../domain/units.ts'
import { readEpciConsumption } from './read-epci-consumption.ts'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'

const regionsDataset = 'residentiel-sobriete/regions'

const departementsDataset = 'residentiel-sobriete/departements'

function toRegionalConsumption(row: DataRow): Result<ResidentialConsumption, InvalidDataset> {
  const dataset = regionsDataset
  return Result.combine([
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'electricity_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'natural_gas_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'fuel_oil_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'lpg_gwh' }),
    requireQuantityColumn<'GigawattHours'>({ dataset, row, column: 'heat_gwh' }),
  ]).map(([electricity, naturalGas, fuelOil, liquefiedPetroleumGas, heat]) => ({
    electricity: gigawattHoursToMegawattHours(electricity),
    naturalGas: gigawattHoursToMegawattHours(naturalGas),
    fuelOil: gigawattHoursToMegawattHours(fuelOil),
    liquefiedPetroleumGas: gigawattHoursToMegawattHours(liquefiedPetroleumGas),
    heat: gigawattHoursToMegawattHours(heat),
  }))
}

function toDepartmentConsumption({
  row,
  networks,
}: {
  row: DataRow
  networks: readonly HeatNetwork[]
}): Result<ResidentialConsumption, InvalidDataset> {
  const dataset = departementsDataset
  const heat = quantity<'MegawattHours'>(
    sum(networks.map(({ deliveredMwh }) => deliveredMwh)).toFixed(),
  )
  return Result.combine([
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'electricity_mwh' }),
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'natural_gas_mwh' }),
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'fuel_oil_mwh' }),
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'lpg_mwh' }),
  ]).map(([electricity, naturalGas, fuelOil, liquefiedPetroleumGas]) => ({
    electricity,
    naturalGas,
    fuelOil,
    liquefiedPetroleumGas,
    heat,
  }))
}

function readResidentialConsumption({
  dataSource,
  territory,
  networks,
}: {
  dataSource: DataSource
  territory: Territory<Level>
  networks: readonly HeatNetwork[]
}): Result<ResidentialConsumption, DataSourceError> {
  return match(territory)
    .with({ level: 'region' }, () =>
      dataSource.row(regionsDataset, territory).andThen(toRegionalConsumption),
    )
    .with({ level: 'departement' }, () =>
      dataSource
        .row(departementsDataset, territory)
        .andThen((row) => toDepartmentConsumption({ row, networks })),
    )
    .with({ level: 'epci' }, (epci) => readEpciConsumption({ dataSource, territory: epci, networks }))
    .exhaustive()
}

export { readResidentialConsumption }
