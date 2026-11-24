import {
  invalidDataset,
  type InvalidDataset,
  type InvalidDatasetReason,
} from '../../domain/data-source.ts'

type Violation = {
  readonly reason: InvalidDatasetReason
  readonly detail: string
}

function violation(reason: InvalidDatasetReason, detail: string): Violation {
  return { reason, detail }
}

function toInvalidDataset(dataset: string): (found: Violation) => InvalidDataset {
  return ({ reason, detail }) => invalidDataset({ dataset, reason, detail })
}

export { toInvalidDataset, violation }
export type { Violation }
