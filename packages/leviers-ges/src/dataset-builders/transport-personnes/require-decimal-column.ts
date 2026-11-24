import type BigNumber from 'bignumber.js'
import type { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'

function requireDecimalColumn({
  dataset,
  row,
  column,
}: {
  dataset: string
  row: DataRow
  column: string
}): Result<BigNumber, InvalidDataset> {
  return requireColumn({ dataset, row, column }).andThen((text) =>
    parseBig(text).mapErr(() =>
      invalidDataset({
        dataset,
        reason: 'unreadable',
        detail: `${column}=${text} is not a decimal number`,
      }),
    ),
  )
}

export { requireDecimalColumn }
