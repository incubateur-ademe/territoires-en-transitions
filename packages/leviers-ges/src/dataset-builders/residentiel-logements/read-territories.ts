import { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

const territoriesDataset = 'territoires/communes.csv'

function readTerritories(
  communesCsv: string,
): Result<ReadonlyMap<string, readonly [string, string]>, InvalidDataset> {
  return parseCsvText({ text: communesCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(territoriesDataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset: territoriesDataset, row, column: 'code_commune' }),
            requireColumn({ dataset: territoriesDataset, row, column: 'code_epci' }),
            requireColumn({ dataset: territoriesDataset, row, column: 'code_departement' }),
          ]).map(([commune, epci, departement]) => [commune, [epci, departement] as const] as const),
        ),
      ),
    )
    .map((entries) => new Map(entries))
}

export { readTerritories }
