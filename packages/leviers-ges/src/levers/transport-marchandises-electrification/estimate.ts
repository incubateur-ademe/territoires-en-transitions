import type { Result } from 'neverthrow'
import { getGoodsTransport } from '../../application/data/transport-marchandises/get-goods-transport.ts'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR } from '../../domain/heavy-vehicle-emission-factor.ts'
import {
  calculateElectrifiedShare,
  calculateTransportMarchandisesElectrificationReduction,
} from './calculate-transport-marchandises-electrification-reduction.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'
import type { TransportMarchandisesElectrificationRequest } from './transport-marchandises-electrification-request.ts'

function estimate(
  { territory, parameters }: TransportMarchandisesElectrificationRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return getGoodsTransport({ dataSource, territory }).map((goodsTransport) => {
    const requestedElectrifiedShare = parameters.additionalElectrifiedFleetFraction
    const electrifiedShare = calculateElectrifiedShare({
      requested: requestedElectrifiedShare,
      zeroEmissionShare: goodsTransport.emissionFactors.zeroEmissionShare,
    })
    return toEstimateResult(
      calculateTransportMarchandisesElectrificationReduction({
        electrifiedShare,
        tonneKilometres: goodsTransport.inputs.tonneKilometres,
        thermalEmissionFactor: goodsTransport.emissionFactors.thermal,
        electricEmissionFactor: ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR,
      }),
      toAppliedAssumptions({ goodsTransport, requestedElectrifiedShare, electrifiedShare }),
    )
  })
}

export { estimate }
