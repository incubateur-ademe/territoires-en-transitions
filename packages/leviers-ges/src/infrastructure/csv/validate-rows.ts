import { Result, err, ok } from 'neverthrow'
import { parseBig, sum } from '../../domain/big-number.ts'
import type { DataRow } from '../../domain/data-source.ts'
import type { DatasetEntry } from './manifest.ts'
import { violation, type Violation } from './violation.ts'

const excessPrecisionPattern = /^-?\d+\.\d{13,}$/
const decimalCommaPattern = /^-?\d+,\d+$/
const scientificNotationPattern = /^-?\d+(\.\d+)?[eE][+-]?\d+$/

function findBadCell(rows: readonly DataRow[]): Violation | undefined {
  return rows
    .flatMap((row) => Object.entries(row))
    .map(([column, value]): Violation | undefined => {
      if (excessPrecisionPattern.test(value)) return violation('excess_precision', `${column}=${value}`)
      if (decimalCommaPattern.test(value)) return violation('decimal_comma', `${column}=${value}`)
      if (scientificNotationPattern.test(value)) {
        return violation('scientific_notation', `${column}=${value}`)
      }
      return undefined
    })
    .find((found) => found !== undefined)
}

function checkNotEmpty(rows: readonly DataRow[]): Result<readonly DataRow[], Violation> {
  return rows.length === 0 ? err(violation('empty_dataset', 'no rows')) : ok(rows)
}

function checkColumns(
  rows: readonly DataRow[],
  entry: Pick<DatasetEntry, 'columns' | 'keyColumn' | 'controlTotals'>,
): Result<readonly DataRow[], Violation> {
  const declared = new Set(entry.columns.map((column) => column.name))
  const actual = new Set(rows.flatMap((row) => Object.keys(row)))
  const undeclaredInCsv = [...actual].filter((name) => !declared.has(name))
  const missingFromCsv = [...declared].filter((name) => !actual.has(name))
  const requiredButUndeclared = [entry.keyColumn, ...Object.keys(entry.controlTotals ?? {})].filter(
    (name) => !declared.has(name),
  )
  const mismatch = [...undeclaredInCsv, ...missingFromCsv, ...requiredButUndeclared]
  return mismatch.length === 0
    ? ok(rows)
    : err(violation('columns_mismatch', [...new Set(mismatch)].join(', ')))
}

function checkCells(rows: readonly DataRow[]): Result<readonly DataRow[], Violation> {
  const badCell = findBadCell(rows)
  return badCell === undefined ? ok(rows) : err(badCell)
}

function columnTotal(rows: readonly DataRow[], column: string): Result<string, Violation> {
  return Result.combine(rows.map((row) => parseBig(row[column] ?? '')))
    .map((values) => sum(values).toFixed())
    .mapErr(() => violation('control_total_mismatch', `${column} is absent or not numeric`))
}

function checkControlTotals(
  rows: readonly DataRow[],
  controlTotals: Readonly<Record<string, string>>,
): Result<readonly DataRow[], Violation> {
  const mismatches = Object.entries(controlTotals).flatMap(([column, expected]) => {
    const total = columnTotal(rows, column)
    if (total.isErr()) return [total.error]
    const expectedTotal = parseBig(expected)
    const matches = expectedTotal.isOk() && expectedTotal.value.isEqualTo(total.value)
    return matches
      ? []
      : [violation('control_total_mismatch', `${column}: expected ${expected}, got ${total.value}`)]
  })
  const [first] = mismatches
  return first === undefined ? ok(rows) : err(first)
}

function indexByKey(
  rows: readonly DataRow[],
  keyColumn: string,
): Result<ReadonlyMap<string, DataRow>, Violation> {
  const entries = rows.flatMap((row): ReadonlyArray<readonly [string, DataRow]> => {
    const key = row[keyColumn]
    return key === undefined ? [] : [[key, row]]
  })
  if (entries.length !== rows.length) return err(violation('missing_key_column', keyColumn))
  if (entries.some(([key]) => key === '')) return err(violation('empty_key', keyColumn))
  const index = new Map(entries)
  return index.size === rows.length ? ok(index) : err(violation('duplicate_key', keyColumn))
}

export { checkCells, checkColumns, checkControlTotals, checkNotEmpty, indexByKey }
