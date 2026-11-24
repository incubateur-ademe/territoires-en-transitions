import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { SECRET_MARKER } from '../secret-statistic.ts'

type LocalConsumption = {
  readonly consumptionsByKey: ReadonlyMap<string, readonly BigNumber[]>
  readonly secretLineCount: number
}

type LocalLine =
  | { readonly kind: 'secret' }
  | { readonly kind: 'consumption'; readonly key: string; readonly amount: BigNumber }

function toLocalLine({
  dataset,
  key,
  consumption,
}: {
  dataset: string
  key: string
  consumption: string
}): Result<LocalLine, InvalidDataset> {
  if (consumption === SECRET_MARKER) return ok({ kind: 'secret' })
  return parseBig(consumption).match(
    (amount): Result<LocalLine, InvalidDataset> => ok({ kind: 'consumption', key, amount }),
    () =>
      err(
        invalidDataset({
          dataset,
          reason: 'unreadable',
          detail: `CONSO=${consumption} is not a decimal number`,
        }),
      ),
  )
}

function groupLocalConsumption({
  dataset,
  csv,
  keyColumn,
  toKey,
}: {
  dataset: string
  csv: string
  keyColumn: string
  toKey: (value: string) => string
}): Result<LocalConsumption, InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ';' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: keyColumn }),
            requireColumn({ dataset, row, column: 'CONSO' }),
          ]).andThen(([value, consumption]) =>
            toLocalLine({ dataset, key: toKey(value), consumption }),
          ),
        ),
      ),
    )
    .map((lines) => {
      const consumptions = lines.flatMap((line) => (line.kind === 'consumption' ? [line] : []))
      const groups = Map.groupBy(consumptions, ({ key }) => key)
      return {
        consumptionsByKey: new Map(
          [...groups].map(([key, group]) => [key, group.map(({ amount }) => amount)]),
        ),
        secretLineCount: lines.filter(({ kind }) => kind === 'secret').length,
      }
    })
}

export { groupLocalConsumption }
export type { LocalConsumption }
