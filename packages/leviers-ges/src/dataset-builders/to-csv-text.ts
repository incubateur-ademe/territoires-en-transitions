import { Result, err, ok } from 'neverthrow'
import { invalidDataset, type InvalidDataset } from '../domain/data-source.ts'

// Source : RFC 4180 : ces caractères obligent à protéger un champ, que ce générateur ne sait pas faire
const UNSAFE_CSV_FIELD = /[",\r\n]/

function toCsvLine({
  dataset,
  fields,
}: {
  dataset: string
  fields: readonly string[]
}): Result<string, InvalidDataset> {
  const unsafeField = fields.find((field) => UNSAFE_CSV_FIELD.test(field))
  return unsafeField === undefined
    ? ok(fields.join(','))
    : err(
        invalidDataset({
          dataset,
          reason: 'malformed_csv',
          detail: `field ${unsafeField} needs CSV quoting`,
        }),
      )
}

function toCsvText({
  dataset,
  columns,
  rows,
}: {
  dataset: string
  columns: readonly string[]
  rows: readonly (readonly string[])[]
}): Result<string, InvalidDataset> {
  return Result.combine([columns, ...rows].map((fields) => toCsvLine({ dataset, fields }))).map(
    (lines) => `${lines.join('\n')}\n`,
  )
}

export { toCsvText }
