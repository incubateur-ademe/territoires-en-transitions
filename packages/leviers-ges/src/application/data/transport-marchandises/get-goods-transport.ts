import type { Result } from 'neverthrow'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import {
  calculateHeavyVehicleEmissionFactors,
  type HeavyVehicleEmissionFactors,
} from '../../../domain/heavy-vehicle-emission-factor.ts'
import type { ComputedLevels } from '../../../domain/lever-registry.ts'
import type { Territory } from '../../../domain/territory.ts'
import type { GoodsTransportInputs } from './goods-transport-inputs.ts'
import { readGoodsTransportInputs } from './read-goods-transport-inputs.ts'

type GoodsTransport = {
  readonly inputs: GoodsTransportInputs
  readonly emissionFactors: HeavyVehicleEmissionFactors
}

function getGoodsTransport({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<ComputedLevels<'transport_marchandises_sobriete_logistique'>>
}): Result<GoodsTransport, DataSourceError> {
  return readGoodsTransportInputs({ dataSource, territory }).map((inputs) => ({
    inputs,
    emissionFactors: calculateHeavyVehicleEmissionFactors({
      dieselEmissionFactor: inputs.dieselEmissionFactor,
      heavyVehicleFleet: inputs.heavyVehicleFleet,
      zeroEmissionFleet: inputs.zeroEmissionFleet,
    }),
  }))
}

export { getGoodsTransport }
export type { GoodsTransport }
