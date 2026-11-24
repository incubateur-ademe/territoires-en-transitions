import { Result } from 'neverthrow'
import type { RailEmissionFactor } from './rail-emission-factor.ts'
import { resolveRailEmissionFactor } from './resolve-rail-emission-factor.ts'
import { readTransportInputs } from './read-transport-inputs.ts'
import {
  resolveRailShare,
  type RailShare,
} from './resolve-rail-share.ts'
import type { TransportInputs } from './transport-inputs.ts'
import type { RegionLookup } from '../../estimate/estimation-context.ts'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import type { Fraction } from '../../../domain/units.ts'

type PassengerTransportInputs = {
  readonly transportInputs: TransportInputs
  readonly railShare: RailShare
  readonly railEmissionFactor: RailEmissionFactor
}

function getPassengerTransportInputs({
  dataSource,
  territory,
  communes,
  requestedRailShare,
  getRegionByCommune,
}: {
  dataSource: DataSource
  territory: Territory<Level>
  communes: readonly string[]
  requestedRailShare: Fraction | undefined
  getRegionByCommune: RegionLookup
}): Result<PassengerTransportInputs, DataSourceError> {
  return Result.combine([
    readTransportInputs({ dataSource, territory }),
    resolveRailShare({ requested: requestedRailShare, communes, getRegionByCommune }),
    resolveRailEmissionFactor({ communes, getRegionByCommune }),
  ]).map(([transportInputs, railShare, railEmissionFactor]) => ({
    transportInputs,
    railShare,
    railEmissionFactor,
  }))
}

export { getPassengerTransportInputs }
