import type BigNumber from 'bignumber.js'
import { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import type { DataRow, InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { requireDecimalColumn } from './require-decimal-column.ts'
import { requireOneOf } from './require-one-of.ts'
import { sourceLevels, type SourceLevel } from './source-level.ts'

type FleetGroup = 'VP' | 'TC_routier'

type FleetRow = {
  readonly level: SourceLevel
  readonly code: string
  readonly group: FleetGroup
  readonly fuel: string
  readonly vehicles: BigNumber
}

const fleetDataset = 'transport-personnes/sources/sdes-parc-vp-tc-routier-2025-par-maille.csv'

const fleetGroups: readonly FleetGroup[] = ['VP', 'TC_routier']

function toFleetRow(row: DataRow): Result<FleetRow, InvalidDataset> {
  const dataset = fleetDataset
  return Result.combine([
    requireOneOf({ dataset, row, column: 'maille', values: sourceLevels }),
    requireColumn({ dataset, row, column: 'code' }),
    requireOneOf({ dataset, row, column: 'groupe', values: fleetGroups }),
    requireColumn({ dataset, row, column: 'carburant' }),
    requireDecimalColumn({ dataset, row, column: 'parc_2025' }),
  ]).map(([level, code, group, fuel, vehicles]) => ({ level, code, group, fuel, vehicles }))
}

function readFleet(csv: string): Result<readonly FleetRow[], InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' })
    .mapErr(toInvalidDataset(fleetDataset))
    .andThen((rows) => Result.combine(rows.map(toFleetRow)))
}

export { fleetDataset, readFleet }
export type { FleetGroup, FleetRow }
