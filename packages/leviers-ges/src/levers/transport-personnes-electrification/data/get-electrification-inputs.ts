import { Result } from 'neverthrow'
import { readTransportInputs } from '../../../application/data/transport-personnes/read-transport-inputs.ts'
import {
  resolveRailShare,
  type RailShare,
} from '../../../application/data/transport-personnes/resolve-rail-share.ts'
import type { TransportInputs } from '../../../application/data/transport-personnes/transport-inputs.ts'
import type { RegionLookup } from '../../../application/estimate/estimation-context.ts'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { ComputedLevels } from '../../../domain/lever-registry.ts'
import type { Territory } from '../../../domain/territory.ts'
import type { Fraction } from '../../../domain/units.ts'
import type { ThermalFleet } from './thermal-fleet.ts'
import { readThermalFleet } from './read-thermal-fleet.ts'

type ElectrificationInputs = {
  readonly transportInputs: TransportInputs
  readonly thermalFleet: ThermalFleet
  readonly railShare: RailShare
}

function getElectrificationInputs({
  dataSource,
  territory,
  communes,
  requestedRailShare,
  getRegionByCommune,
}: {
  dataSource: DataSource
  territory: Territory<ComputedLevels<'transport_personnes_electrification'>>
  communes: readonly string[]
  requestedRailShare: Fraction | undefined
  getRegionByCommune: RegionLookup
}): Result<ElectrificationInputs, DataSourceError> {
  return Result.combine([
    readTransportInputs({ dataSource, territory }),
    readThermalFleet({ dataSource, territory }),
    resolveRailShare({ requested: requestedRailShare, communes, getRegionByCommune }),
  ]).map(([transportInputs, thermalFleet, railShare]) => ({
    transportInputs,
    thermalFleet,
    railShare,
  }))
}

export { getElectrificationInputs }
