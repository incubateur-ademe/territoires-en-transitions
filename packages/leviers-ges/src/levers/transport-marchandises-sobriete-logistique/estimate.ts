import type { Result } from 'neverthrow'
import { getGoodsTransport } from '../../application/data/transport-marchandises/get-goods-transport.ts'
import { toGoodsTransportAssumptions } from '../../application/data/transport-marchandises/to-goods-transport-assumptions.ts'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { calculateTransportMarchandisesSobrieteLogistiqueReduction } from './calculate-transport-marchandises-sobriete-logistique-reduction.ts'
import type { TransportMarchandisesSobrieteLogistiqueRequest } from './transport-marchandises-sobriete-logistique-request.ts'

function estimate(
  { territory, parameters }: TransportMarchandisesSobrieteLogistiqueRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return getGoodsTransport({ dataSource, territory }).map((goodsTransport) =>
    toEstimateResult(
      calculateTransportMarchandisesSobrieteLogistiqueReduction({
        roadFreightReduction: parameters.roadFreightReductionFraction,
        tonneKilometres: goodsTransport.inputs.tonneKilometres,
        emissionFactor: goodsTransport.emissionFactors.mixed,
      }),
      toGoodsTransportAssumptions(goodsTransport),
    ),
  )
}

export { estimate }
