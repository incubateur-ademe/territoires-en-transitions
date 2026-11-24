import { err, ok, type Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'

function requireOneOf<Value extends string>({
  dataset,
  row,
  column,
  values,
}: {
  dataset: string
  row: DataRow
  column: string
  values: readonly Value[]
}): Result<Value, InvalidDataset> {
  return requireColumn({ dataset, row, column }).andThen((text) => {
    const value = values.find((candidate) => candidate === text)
    return value === undefined
      ? err(invalidDataset({ dataset, reason: 'columns_mismatch', detail: `${column}=${text}` }))
      : ok(value)
  })
}

export { requireOneOf }
