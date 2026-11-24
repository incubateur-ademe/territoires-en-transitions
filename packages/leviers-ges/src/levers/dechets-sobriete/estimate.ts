import type { Result } from 'neverthrow'
import { readWasteTreatment } from '../../application/data/dechets/read-waste-treatment.ts'
import { toWasteAssumptions } from '../../application/data/dechets/to-waste-assumptions.ts'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateDechetsSobrieteReduction } from './calculate-dechets-sobriete-reduction.ts'
import type { DechetsSobrieteRequest } from './dechets-sobriete-request.ts'

function estimate(
  { territory, parameters }: DechetsSobrieteRequest,
  { dataSource, getCommunesOf }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory)
    .andThen((communes) => readWasteTreatment({ dataSource, communes }))
    .map((wasteTypes) =>
      toEstimateResult(
        calculateDechetsSobrieteReduction({
          reductions: {
            storage: parameters.storageReductionFraction,
            incineration: parameters.incinerationReductionFraction,
          },
          wasteTypes,
        }),
        toWasteAssumptions(wasteTypes),
      ),
    )
}

export { estimate }
