import { join } from 'node:path'
import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { HOUSING_COLUMNS, toHousingRecord, type HousingColumn } from './housing-cells.ts'

type HousingCommune = {
  readonly epci: string
  readonly departement: string
  readonly squareMetres: Readonly<Record<HousingColumn, BigNumber>>
}

const housingDataset = 'residentiel-logements/logements-departement'

const housingSourceDataset = 'residentiel-logements/sources/insee-rp2022-logements-communes.csv'

const housingFolder = 'residentiel-logements'

const housingFile = 'sources/insee-rp2022-logements-communes.csv'

function readHousingSourceText(dataDirectory: string): Result<string, InvalidDataset> {
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: housingFolder,
    file: 'logements-departement.csv',
  })
    .mapErr(toInvalidDataset(housingDataset))
    .andThen((entry) =>
      readManifestSourceText({
        folderPath: join(dataDirectory, housingFolder),
        entry,
        file: housingFile,
        dataset: housingDataset,
      }),
    )
}

function toSquareMetres({
  row,
  column,
}: {
  row: Readonly<Record<string, string>>
  column: string
}): Result<BigNumber, InvalidDataset> {
  const dataset = housingSourceDataset
  return requireColumn({ dataset, row, column }).andThen((text) =>
    parseBig(text).match(
      (squareMetres) => ok(squareMetres),
      () =>
        err(
          invalidDataset({
            dataset,
            reason: 'unreadable',
            detail: `${column}=${text} is not a decimal number`,
          }),
        ),
    ),
  )
}

function readHousingCommunes(housingCsv: string): Result<readonly HousingCommune[], InvalidDataset> {
  const dataset = housingSourceDataset
  return parseCsvText({ text: housingCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'epci' }),
            requireColumn({ dataset, row, column: 'departement' }),
            Result.combine(
              HOUSING_COLUMNS.map((column) =>
                toSquareMetres({ row, column }).map((squareMetres) => [column, squareMetres] as const),
              ),
            ),
          ]).map(([epci, departement, cells]) => ({
            epci,
            departement,
            squareMetres: toHousingRecord(cells),
          })),
        ),
      ),
    )
}

export { housingDataset, readHousingCommunes, readHousingSourceText }
export type { HousingCommune }
