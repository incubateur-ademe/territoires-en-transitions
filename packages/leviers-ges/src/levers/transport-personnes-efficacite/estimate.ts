import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateTransportPersonnesEfficaciteReduction } from './calculate-transport-personnes-efficacite-reduction.ts'
import { getEfficiencyInputs } from './data/get-efficiency-inputs.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'
import type { TransportPersonnesEfficaciteRequest } from './transport-personnes-efficacite-request.ts'

function estimate(
  { territory, parameters }: TransportPersonnesEfficaciteRequest,
  { dataSource, getCommunesOf, getRegionByCommune }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory)
    .andThen((communes) =>
      getEfficiencyInputs({
        dataSource,
        territory,
        communes,
        requestedRailShare: parameters.railShareFraction,
        getRegionByCommune,
      }),
    )
    .map(({ transportInputs, railShare }) =>
      toEstimateResult(
        calculateTransportPersonnesEfficaciteReduction({
          fractions: {
            carEcodrivingApplication: parameters.carEcodrivingApplicationFraction,
            busEcodrivingApplication: parameters.busEcodrivingApplicationFraction,
            carPassengerIncrease: parameters.carPassengerIncrease,
            busPassengerIncrease: parameters.busPassengerIncrease,
          },
          railShare: railShare.fraction,
          transportInputs,
        }),
        toAppliedAssumptions({ transportInputs, railShare }),
      ),
    )
}

export { estimate }
