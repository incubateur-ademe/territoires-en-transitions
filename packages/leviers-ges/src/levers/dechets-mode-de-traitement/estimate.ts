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
import { calculateDechetsModeDeTraitementReduction } from './calculate-dechets-mode-de-traitement-reduction.ts'
import type { DechetsModeDeTraitementRequest } from './dechets-mode-de-traitement-request.ts'

function estimate(
  { territory, parameters }: DechetsModeDeTraitementRequest,
  { dataSource, getCommunesOf }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory)
    .andThen((communes) => readWasteTreatment({ dataSource, communes }))
    .map((wasteTypes) =>
      toEstimateResult(
        calculateDechetsModeDeTraitementReduction({
          shifts: {
            storageToIncineration: parameters.storageToIncinerationFraction,
            storageToMaterialRecovery: parameters.storageToMaterialRecoveryFraction,
            incinerationToMaterialRecovery: parameters.incinerationToMaterialRecoveryFraction,
          },
          wasteTypes,
        }),
        toWasteAssumptions(wasteTypes),
      ),
    )
}

export { estimate }
