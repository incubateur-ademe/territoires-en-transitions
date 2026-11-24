import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import { getResidentialInputs } from '../../application/residential-consumption/get-residential-inputs.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateResidentielRenovationReduction } from './calculate-residentiel-renovation-reduction.ts'
import { readEligibleSurfaceShares } from './data/read-eligible-surface-shares.ts'
import type { ResidentielRenovationRequest } from './residentiel-renovation-request.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'

function estimate(
  { territory, parameters }: ResidentielRenovationRequest,
  { dataSource, getCommunesOf, getDepartementByCommune }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory).andThen((communes) =>
    getResidentialInputs({ dataSource, territory, communes }).andThen(
      ({ consumption, heatEmissionFactor }) =>
        readEligibleSurfaceShares({ dataSource, territory, communes, getDepartementByCommune }).map(
          (eligibleSurfaceShare) =>
            toEstimateResult(
              calculateResidentielRenovationReduction({
                renovatedParcFraction: parameters.renovatedParcFraction,
                consumption,
                eligibleSurfaceShare,
                heatEmissionFactor,
              }),
              toAppliedAssumptions(),
            ),
        ),
    ),
  )
}

export { estimate }
