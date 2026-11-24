import { parse } from 'csv-parse/sync'
import { Result } from 'neverthrow'
import { z } from 'zod'
import type { DataRow } from '../../domain/data-source.ts'
import { violation, type Violation } from './violation.ts'

type CsvTextOptions = {
  readonly text: string
  readonly delimiter: string
}

function rejectDuplicateColumns(header: string[]): string[] {
  if (new Set(header).size !== header.length) throw new Error('duplicate column names')
  return header
}

const rowsSchema = z.array(z.record(z.string(), z.string()))

const parseCsvText = Result.fromThrowable(
  ({ text, delimiter }: CsvTextOptions): readonly DataRow[] =>
    rowsSchema.parse(
      parse(text, { columns: rejectDuplicateColumns, skip_empty_lines: true, delimiter }),
    ),
  (error): Violation => violation('malformed_csv', String(error)),
)

export { parseCsvText }
