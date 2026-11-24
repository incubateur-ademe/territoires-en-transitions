import { roundOutput } from '../../domain/big-number.ts'
import { quantity, type TonnesCo2ePerYear } from '../../domain/units.ts'

type AppliedAssumption = {
  readonly value: string
  readonly source: string
  readonly limit: string
}

type AppliedAssumptions = Readonly<Record<string, AppliedAssumption>>

type EstimateResult = {
  readonly reduction: TonnesCo2ePerYear
  readonly appliedAssumptions: AppliedAssumptions
}

function toEstimateResult(
  reduction: TonnesCo2ePerYear,
  appliedAssumptions: AppliedAssumptions = {},
): EstimateResult {
  return {
    reduction: quantity<'TonnesCo2ePerYear'>(roundOutput(reduction).toFixed()),
    appliedAssumptions,
  }
}

export { toEstimateResult }
export type { AppliedAssumption, AppliedAssumptions, EstimateResult }
