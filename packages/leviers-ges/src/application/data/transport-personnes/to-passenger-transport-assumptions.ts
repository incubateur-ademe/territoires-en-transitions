import type { RailShare } from './resolve-rail-share.ts'
import {
  toBusEmissionFactorAssumption,
  toBusFleetUnclassifiedAssumption,
  toCarFleetUnclassifiedAssumption,
  toNationalBusAssumption,
  toNationalCarAssumption,
} from './to-fleet-assumptions.ts'
import { toRailShareAssumption } from './to-rail-share-assumption.ts'
import type { TransportInputs } from './transport-inputs.ts'
import type { AppliedAssumptions } from '../../estimate/estimate-result.ts'
import type { RailEmissionFactor } from './rail-emission-factor.ts'
import { toRailEmissionFactorAssumption } from './to-rail-emission-factor-assumption.ts'

function toPassengerTransportAssumptions({
  transportInputs,
  railShare,
  railEmissionFactor,
}: {
  transportInputs: TransportInputs
  railShare: RailShare
  railEmissionFactor: RailEmissionFactor
}): AppliedAssumptions {
  return {
    ...toBusEmissionFactorAssumption(transportInputs),
    ...toRailEmissionFactorAssumption(railEmissionFactor),
    ...toRailShareAssumption(railShare),
    ...toCarFleetUnclassifiedAssumption(transportInputs),
    ...toBusFleetUnclassifiedAssumption(transportInputs),
    ...toNationalCarAssumption(transportInputs),
    ...toNationalBusAssumption(transportInputs),
  }
}

export { toPassengerTransportAssumptions }
