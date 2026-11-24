import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateResidentielSobrieteReduction } from './calculate-residentiel-sobriete-reduction.ts'
import { getResidentialInputs } from '../../application/residential-consumption/get-residential-inputs.ts'
import type { ResidentielSobrieteRequest } from './residentiel-sobriete-request.ts'

function estimate(
  { territory, parameters }: ResidentielSobrieteRequest,
  { dataSource, getCommunesOf }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory)
    .andThen((communes) => getResidentialInputs({ dataSource, territory, communes }))
    .map(({ consumption, heatEmissionFactor }) =>
      toEstimateResult(
        calculateResidentielSobrieteReduction({
          sobrietyFractions: {
            households: parameters.householdsApplyingSobrietyFraction,
            consumptionReduction: parameters.consumptionReductionFraction,
          },
          consumption,
          heatEmissionFactor,
        }),
      ),
    )
}

export { estimate }
