import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import { calculateEpciDeliveredNitrogen } from './calculate-epci-delivered-nitrogen.ts'
import { calculateFertilisationAzoteeReduction } from './calculate-fertilisation-azotee-reduction.ts'
import type { NitrogenDelivered } from './data/nitrogen-delivered.ts'
import { readEpciNitrogenParts } from './data/read-epci-nitrogen-parts.ts'
import { readNitrogenDelivered } from './data/read-nitrogen-delivered.ts'
import type { FertilisationAzoteeRequest } from './fertilisation-azotee-request.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'

function readDelivered({
  territory,
  context,
}: {
  territory: FertilisationAzoteeRequest['territory']
  context: EstimationContext
}): Result<NitrogenDelivered, DataSourceError | UnknownTerritory> {
  const { dataSource, getCommunesOf, getDepartementByCommune } = context
  if (territory.level === 'epci') {
    return readEpciNitrogenParts({
      dataSource,
      territory: { ...territory, level: territory.level },
      getCommunesOf,
      getDepartementByCommune,
    }).map((parts) => ({ tonnes: calculateEpciDeliveredNitrogen(parts) }))
  }
  return readNitrogenDelivered({ dataSource, territory: { ...territory, level: territory.level } })
}

function estimate(
  { territory, parameters }: FertilisationAzoteeRequest,
  context: EstimationContext,
): Result<EstimateResult, DataSourceError | UnknownTerritory> {
  return readDelivered({ territory, context }).map((delivered) =>
    toEstimateResult(
      calculateFertilisationAzoteeReduction({
        nitrogenReductionFraction: parameters.nitrogenReductionFraction,
        deliveredNitrogen: delivered.tonnes,
      }),
      toAppliedAssumptions(),
    ),
  )
}

export { estimate }
