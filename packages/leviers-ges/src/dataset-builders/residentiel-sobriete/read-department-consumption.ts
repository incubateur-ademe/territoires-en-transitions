import { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'

function readDepartmentConsumption({
  dataset,
  csv,
}: {
  dataset: string
  csv: string
}): Result<ReadonlyMap<string, string>, InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'code_departement' }),
            requireColumn({ dataset, row, column: 'conso_mwh_hors_secret' }).andThen((text) =>
              roundToLoaderPrecision({ dataset, column: 'conso_mwh_hors_secret', text }),
            ),
          ]),
        ),
      ),
    )
    .map((consumptionByDepartment) => new Map(consumptionByDepartment))
}

export { readDepartmentConsumption }
