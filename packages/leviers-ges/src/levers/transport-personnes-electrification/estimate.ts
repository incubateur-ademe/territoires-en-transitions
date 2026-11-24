import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateTransportPersonnesElectrificationReduction } from './calculate-transport-personnes-electrification-reduction.ts'
import { getElectrificationInputs } from './data/get-electrification-inputs.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'
import type { TransportPersonnesElectrificationRequest } from './transport-personnes-electrification-request.ts'

function estimate(
  { territory, parameters }: TransportPersonnesElectrificationRequest,
  { dataSource, getCommunesOf, getRegionByCommune }: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return getCommunesOf(territory)
    .andThen((communes) =>
      getElectrificationInputs({
        dataSource,
        territory,
        communes,
        requestedRailShare: parameters.railShareFraction,
        getRegionByCommune,
      }),
    )
    .map(({ transportInputs, thermalFleet, railShare }) => {
      const fractions = {
        carElectrification: parameters.carElectrificationFraction,
        busElectrification: parameters.busElectrificationFraction,
      }
      return toEstimateResult(
        calculateTransportPersonnesElectrificationReduction({
          fractions,
          railShare: railShare.fraction,
          transportFlows: transportInputs,
          thermalFleet,
        }),
        toAppliedAssumptions({ fractions, thermalFleet, railShare }),
      )
    })
}

export { estimate }
