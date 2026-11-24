import { err, ok, type Result } from 'neverthrow'
import { parseBig } from '../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../domain/data-source.ts'
import { quantity, type Quantity, type UnitName } from '../domain/units.ts'

type ColumnReference = {
  readonly dataset: string
  readonly row: DataRow
  readonly column: string
}

function requireColumn({ dataset, row, column }: ColumnReference): Result<string, InvalidDataset> {
  const value = row[column]
  return value === undefined
    ? err(invalidDataset({ dataset, reason: 'columns_mismatch', detail: column }))
    : ok(value)
}

function requireNonEmptyColumn(reference: ColumnReference): Result<string, InvalidDataset> {
  return requireColumn(reference).andThen((value) =>
    value.trim() === ''
      ? err(invalidDataset({ dataset: reference.dataset, reason: 'empty_key', detail: reference.column }))
      : ok(value),
  )
}

function requireQuantityColumn<U extends UnitName>(
  reference: ColumnReference,
): Result<Quantity<U>, InvalidDataset> {
  return requireColumn(reference).andThen((value) =>
    parseBig(value).isOk()
      ? ok(quantity<U>(value))
      : err(
          invalidDataset({
            dataset: reference.dataset,
            reason: 'unreadable',
            detail: `${reference.column}=${value} is not a decimal number`,
          }),
        ),
  )
}

function requireOptionalQuantityColumn<U extends UnitName>(
  reference: ColumnReference,
): Result<Quantity<U> | undefined, InvalidDataset> {
  return requireColumn(reference).andThen((value) =>
    value === '' ? ok(undefined) : requireQuantityColumn<U>(reference),
  )
}

export { requireColumn, requireNonEmptyColumn, requireOptionalQuantityColumn, requireQuantityColumn }
