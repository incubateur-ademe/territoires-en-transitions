import {
  toEstimateResult,
  type EstimateResult,
} from '../../application/estimate/estimate-result.ts'
import { calculateHaiesReduction, HEDGE_STORAGE_FACTOR } from './calculate-haies-reduction.ts'
import type { HaiesRequest } from './haies-request.ts'

function estimate({ parameters }: HaiesRequest): EstimateResult {
  return toEstimateResult(
    calculateHaiesReduction(parameters.hedgeKmCreatedPerYear, HEDGE_STORAGE_FACTOR),
  )
}

export { estimate }
