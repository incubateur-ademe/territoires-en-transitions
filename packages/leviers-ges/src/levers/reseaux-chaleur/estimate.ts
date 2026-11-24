import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import {
  readHeatNetworks,
  reseauxChaleurNetworksDataset,
} from '../../application/heat-networks/read-heat-networks.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateReseauxChaleurReduction } from './calculate-reseaux-chaleur-reduction.ts'
import type { ReseauxChaleurRequest } from './reseaux-chaleur-request.ts'

function estimate(
  { territory, parameters }: ReseauxChaleurRequest,
  { dataSource, getCommunesOf }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory)
    .andThen((communes) => readHeatNetworks({ dataSource, dataset: reseauxChaleurNetworksDataset, communes }))
    .map((networks) =>
      toEstimateResult(
        calculateReseauxChaleurReduction({
          reductionFraction: parameters.emissionFactorReductionFraction,
          networks,
        }),
      ),
    )
}

export { estimate }
