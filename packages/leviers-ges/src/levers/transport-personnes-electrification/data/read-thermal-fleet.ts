import { Result } from 'neverthrow'
import { readTransportRow } from '../../../application/data/transport-personnes/read-transport-row.ts'
import { requireQuantityColumn } from '../../../application/require-column.ts'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Territory } from '../../../domain/territory.ts'
import type { ComputedLevels } from '../../../domain/lever-registry.ts'
import type { ThermalFleet } from './thermal-fleet.ts'

function readThermalFleet({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<ComputedLevels<'transport_personnes_electrification'>>
}): Result<ThermalFleet, DataSourceError> {
  return readTransportRow({ dataSource, territory }).andThen(({ dataset, row }) =>
    Result.combine([
      requireQuantityColumn<'KgCo2ePerVehicleKilometre'>({
        dataset,
        row,
        column: 'car_thermal_emission_factor_kg_per_km',
      }),
      requireQuantityColumn<'KgCo2ePerVehicleKilometre'>({
        dataset,
        row,
        column: 'bus_thermal_emission_factor_kg_per_km',
      }),
      requireQuantityColumn<'Fraction'>({ dataset, row, column: 'car_thermal_fleet_share' }),
      requireQuantityColumn<'Fraction'>({ dataset, row, column: 'bus_thermal_fleet_share' }),
    ]).map(
      ([
        carThermalEmissionFactor,
        busThermalEmissionFactor,
        carThermalFleetShare,
        busThermalFleetShare,
      ]) => ({
        carThermalEmissionFactor,
        busThermalEmissionFactor,
        carThermalFleetShare,
        busThermalFleetShare,
      }),
    ),
  )
}

export { readThermalFleet }
