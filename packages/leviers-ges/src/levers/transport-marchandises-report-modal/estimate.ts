import type { Result } from 'neverthrow'
import { getGoodsTransport } from '../../application/data/transport-marchandises/get-goods-transport.ts'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { calculateTransportMarchandisesReportModalReduction } from './calculate-transport-marchandises-report-modal-reduction.ts'
import { DEFAULT_CYCLOLOGISTIC_TONNE_KILOMETRES } from './report-modal-constants.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'
import type { TransportMarchandisesReportModalRequest } from './transport-marchandises-report-modal-request.ts'

function estimate(
  { territory, parameters }: TransportMarchandisesReportModalRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return getGoodsTransport({ dataSource, territory }).map((goodsTransport) =>
    toEstimateResult(
      calculateTransportMarchandisesReportModalReduction({
        roadToRail: parameters.roadToRailFraction,
        roadToWaterway: parameters.roadToWaterwayFraction,
        tonneKilometres: goodsTransport.inputs.tonneKilometres,
        cyclologisticTonneKilometres:
          parameters.cyclologisticTonneKilometres ?? DEFAULT_CYCLOLOGISTIC_TONNE_KILOMETRES,
        roadEmissionFactor: goodsTransport.emissionFactors.mixed,
      }),
      toAppliedAssumptions({
        goodsTransport,
        cyclologisticTonneKilometres: parameters.cyclologisticTonneKilometres?.toFixed(),
      }),
    ),
  )
}

export { estimate }
