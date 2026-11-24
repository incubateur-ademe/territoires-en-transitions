import type { Result } from 'neverthrow'
import { getGoodsTransport } from '../../application/data/transport-marchandises/get-goods-transport.ts'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { calculateTransportMarchandisesEfficaciteReduction } from './calculate-transport-marchandises-efficacite-reduction.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'
import type { TransportMarchandisesEfficaciteRequest } from './transport-marchandises-efficacite-request.ts'

function estimate(
  { territory, parameters }: TransportMarchandisesEfficaciteRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return getGoodsTransport({ dataSource, territory }).map((goodsTransport) =>
    toEstimateResult(
      calculateTransportMarchandisesEfficaciteReduction({
        ecodrivingApplication: parameters.ecodrivingApplicationFraction,
        loadFactorIncrease: parameters.loadFactorIncrease,
        tonneKilometres: goodsTransport.inputs.tonneKilometres,
        emissionFactor: goodsTransport.emissionFactors.mixed,
      }),
      toAppliedAssumptions(goodsTransport),
    ),
  )
}

export { estimate }
