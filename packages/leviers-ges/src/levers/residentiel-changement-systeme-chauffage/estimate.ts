import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { InvalidRequest } from '../../application/estimate/estimation-error.ts'
import { getResidentialInputs } from '../../application/residential-consumption/get-residential-inputs.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import {
  calculateCurrentUsefulShares,
  calculateResidentielChangementSystemeChauffageReduction,
} from './calculate-residentiel-changement-systeme-chauffage-reduction.ts'
import { NATIONAL_HEATING_SHARES_ASSUMPTION } from './national-heating-shares-assumption.ts'
import type { ResidentielChangementSystemeChauffageRequest } from './residentiel-changement-systeme-chauffage-request.ts'
import { resolveTargetShares } from './resolve-target-shares.ts'
import { UNSPECIFIED_TARGET_SHARES_ASSUMPTION } from './unspecified-target-shares-assumption.ts'

function estimate(
  { territory, parameters }: ResidentielChangementSystemeChauffageRequest,
  { dataSource, getCommunesOf }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory | InvalidRequest> {
  const requested = {
    electricity: parameters.targetElectricityShareFraction,
    naturalGas: parameters.targetNaturalGasShareFraction,
    fuelOil: parameters.targetFuelOilShareFraction,
    wood: parameters.targetWoodShareFraction,
    heat: parameters.targetHeatNetworkShareFraction,
  }
  const hasUnspecifiedShare = Object.values(requested).some((share) => share === undefined)
  return getCommunesOf(territory)
    .andThen((communes) => getResidentialInputs({ dataSource, territory, communes }))
    .andThen(({ consumption, heatEmissionFactor }) =>
      resolveTargetShares({ requested, current: calculateCurrentUsefulShares(consumption) }).map(
        (targetShares) =>
          toEstimateResult(
            calculateResidentielChangementSystemeChauffageReduction({
              targetShares,
              consumption,
              heatEmissionFactor,
            }),
            {
              nationalHeatingShares: NATIONAL_HEATING_SHARES_ASSUMPTION,
              ...(hasUnspecifiedShare ? { unspecifiedTargetShares: UNSPECIFIED_TARGET_SHARES_ASSUMPTION } : {}),
            },
          ),
      ),
    )
}

export { estimate }
