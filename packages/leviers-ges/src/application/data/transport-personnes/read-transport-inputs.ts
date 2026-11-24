import { Result } from 'neverthrow'
import { requireQuantityColumn } from '../../require-column.ts'
import type {
  DataRow,
  DataSource,
  DataSourceError,
  InvalidDataset,
} from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import { readTransportRow } from './read-transport-row.ts'
import type { TransportInputs } from './transport-inputs.ts'

function toTransportInputs({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<TransportInputs, InvalidDataset> {
  return Result.combine([
    requireQuantityColumn<'PassengerKilometresPerWeek'>({
      dataset,
      row,
      column: 'car_weekly_passenger_km',
    }),
    requireQuantityColumn<'PassengerKilometresPerWeek'>({
      dataset,
      row,
      column: 'public_transport_weekly_passenger_km',
    }),
    requireQuantityColumn<'KgCo2ePerVehicleKilometre'>({
      dataset,
      row,
      column: 'car_emission_factor_kg_per_km',
    }),
    requireQuantityColumn<'KgCo2ePerVehicleKilometre'>({
      dataset,
      row,
      column: 'bus_emission_factor_kg_per_km',
    }),
    requireQuantityColumn<'Fraction'>({ dataset, row, column: 'car_fleet_unclassified_share' }),
    requireQuantityColumn<'Fraction'>({ dataset, row, column: 'bus_fleet_unclassified_share' }),
    requireQuantityColumn<'Vehicles'>({ dataset, row, column: 'car_fleet_classified' }),
    requireQuantityColumn<'Vehicles'>({ dataset, row, column: 'bus_fleet_classified' }),
  ]).map(
    ([
      carWeeklyPassengerKm,
      publicTransportWeeklyPassengerKm,
      carEmissionFactor,
      busEmissionFactor,
      carFleetUnclassifiedShare,
      busFleetUnclassifiedShare,
      carFleetClassified,
      busFleetClassified,
    ]) => ({
      carWeeklyPassengerKm,
      publicTransportWeeklyPassengerKm,
      carEmissionFactor,
      busEmissionFactor,
      carFleetUnclassifiedShare,
      busFleetUnclassifiedShare,
      carFleetClassified,
      busFleetClassified,
    }),
  )
}

function readTransportInputs({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<Level>
}): Result<TransportInputs, DataSourceError> {
  return readTransportRow({ dataSource, territory }).andThen(({ dataset, row }) =>
    toTransportInputs({ dataset, row }),
  )
}

export { readTransportInputs }
