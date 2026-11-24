import type BigNumber from 'bignumber.js'
import { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import type { DataRow, InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { requireDecimalColumn } from './require-decimal-column.ts'
import { requireOneOf } from './require-one-of.ts'
import { sourceLevels, type SourceLevel } from './source-level.ts'

type CommutingRow = {
  readonly level: SourceLevel
  readonly code: string
  readonly mode: string
  readonly weeklyPassengerKm: BigNumber
}

const commutingDataset =
  'transport-personnes/sources/insee-sdes-domicile-travail-2022-agregats-par-mode.csv'

function toCommutingRow(row: DataRow): Result<CommutingRow, InvalidDataset> {
  const dataset = commutingDataset
  return Result.combine([
    requireOneOf({ dataset, row, column: 'level', values: sourceLevels }),
    requireColumn({ dataset, row, column: 'code' }),
    requireColumn({ dataset, row, column: 'mode' }),
    requireDecimalColumn({ dataset, row, column: 'sum_ipondi_dist_hebdo' }),
  ]).map(([level, code, mode, weeklyPassengerKm]) => ({
    level,
    code,
    mode,
    weeklyPassengerKm,
  }))
}

function readCommutingPassengerKm(csv: string): Result<readonly CommutingRow[], InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' })
    .mapErr(toInvalidDataset(commutingDataset))
    .andThen((rows) => Result.combine(rows.map(toCommutingRow)))
}

export { commutingDataset, readCommutingPassengerKm }
export type { CommutingRow }
