import { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { calculateOccupationDesSolsStorage } from './calculate-occupation-des-sols-storage.ts'
import { readOccupationAreas } from './data/read-occupation-areas.ts'
import { readOccupationFactors } from './data/read-occupation-factors.ts'
import type { OccupationDesSolsRequest } from './occupation-des-sols-request.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'

function estimate(
  { territory, parameters }: OccupationDesSolsRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return Result.combine([
    readOccupationAreas({ dataSource, territory }),
    readOccupationFactors({ dataSource, territory }),
  ]).map(([areas, factors]) =>
    toEstimateResult(
      calculateOccupationDesSolsStorage({
        afforestationHectaresPerYear: parameters.afforestationHectaresPerYear,
        wetlandDevelopmentHectaresPerYear: parameters.wetlandDevelopmentHectaresPerYear,
        desealingHectaresPerYear: parameters.desealingHectaresPerYear,
        horizonYears: parameters.horizonYears,
        areas,
        factors,
      }),
      toAppliedAssumptions(territory.level),
    ),
  )
}

export { estimate }
