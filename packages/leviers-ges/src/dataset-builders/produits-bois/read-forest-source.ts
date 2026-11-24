import { join } from 'node:path'
import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { requireColumn, requireNonEmptyColumn } from '../../application/require-column.ts'
import { parseBig, sum } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type ForestCommune = {
  readonly epci: string
  readonly departement: string
  readonly hectares: BigNumber
}

const forestDataset = 'produits-bois/foret-departement'

const forestFolder = 'produits-bois'

const forestFile = 'sources/aldo-stocks-carbone-communes-surfaces-foret.csv'

// Source : ALDO, jeu « stocks de carbone - communes » (data.ademe.fr/datasets/aldo-stocks-de-carbone) : une surface de forêt par type de peuplement (mixte, feuillu, conifère, peupleraie), en hectares
const FOREST_AREA_COLUMNS = [
  'foret_mixte_surface_ha',
  'foret_feuillu_surface_ha',
  'foret_conifere_surface_ha',
  'foret_peupleraie_surface_ha',
] as const

function readForestSourceText(dataDirectory: string): Result<string, InvalidDataset> {
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: forestFolder,
    file: 'foret-departement.csv',
  })
    .mapErr(toInvalidDataset(forestDataset))
    .andThen((entry) =>
      readManifestSourceText({
        folderPath: join(dataDirectory, forestFolder),
        entry,
        file: forestFile,
        dataset: forestDataset,
      }),
    )
}

function toHectares(
  row: Readonly<Record<string, string>>,
): Result<BigNumber, InvalidDataset> {
  const dataset = forestDataset
  return Result.combine(
    FOREST_AREA_COLUMNS.map((column) =>
      requireColumn({ dataset, row, column }).andThen((text) =>
        parseBig(text).match(
          (value) => ok(value),
          () =>
            err(
              invalidDataset({
                dataset,
                reason: 'unreadable',
                detail: `${column}=${text} is not a decimal number`,
              }),
            ),
        ),
      ),
    ),
  ).map(sum)
}

function readForestCommunes(forestCsv: string): Result<readonly ForestCommune[], InvalidDataset> {
  const dataset = forestDataset
  return parseCsvText({ text: forestCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'epci' }),
            requireNonEmptyColumn({ dataset, row, column: 'departement' }),
            toHectares(row),
          ]).map(([epci, departement, hectares]) => ({ epci, departement, hectares })),
        ),
      ),
    )
}

export { forestDataset, readForestCommunes, readForestSourceText }
export type { ForestCommune }
