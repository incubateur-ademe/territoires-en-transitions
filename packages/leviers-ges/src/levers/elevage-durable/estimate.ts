import type { Result } from 'neverthrow'
import type { EstimationContext } from '../../application/estimate/estimation-context.ts'
import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import type { DataSourceError } from '../../domain/data-source.ts'
import { calculateElevageDurableReduction } from './calculate-elevage-durable-reduction.ts'
import { readLivestockHeadcount } from './data/read-livestock-headcount.ts'
import type { ElevageDurableRequest } from './elevage-durable-request.ts'
import { toAnimalChanges } from './to-animal-changes.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'

function estimate(
  { territory, parameters }: ElevageDurableRequest,
  { dataSource }: EstimationContext,
): Result<EstimateResult, DataSourceError> {
  return readLivestockHeadcount({ dataSource, territory }).map((headcount) =>
    toEstimateResult(
      calculateElevageDurableReduction(toAnimalChanges({ animals: parameters.animals, headcount })),
      toAppliedAssumptions(parameters.animals),
    ),
  )
}

export { estimate }
