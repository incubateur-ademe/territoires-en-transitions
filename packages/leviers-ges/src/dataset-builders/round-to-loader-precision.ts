import type { Result } from 'neverthrow'
import { parseBigWithExponent } from '../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../domain/data-source.ts'

// Source : src/infrastructure/csv/validate-rows.ts : le chargeur CSV refuse plus de 12 décimales (excessPrecisionPattern)
const MAX_DECIMAL_PLACES = 12

function roundToLoaderPrecision({
  dataset,
  column,
  text,
}: {
  dataset: string
  column: string
  text: string
}): Result<string, InvalidDataset> {
  return parseBigWithExponent(text)
    .map((value) => {
      const rounded = value.decimalPlaces(MAX_DECIMAL_PLACES)
      return rounded.plus(0).toFixed()
    })
    .mapErr(() =>
      invalidDataset({
        dataset,
        reason: 'unreadable',
        detail: `${column}=${text} is not a decimal number`,
      }),
    )
}

export { roundToLoaderPrecision }
