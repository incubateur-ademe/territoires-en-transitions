import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type WoodSources = {
  readonly harvestCsv: string
  readonly productsCarbonCsv: string
}

const woodDataset = 'produits-bois/constants'
const woodFolder = 'produits-bois'
const harvestFile = 'sources/agreste-exfnr00-recolte-bois-2018-2022.csv'
const productsCarbonFile = 'sources/ominea-2026-tableau-45-produits-bois-tc.csv'

function readWoodSources(dataDirectory: string): Result<WoodSources, InvalidDataset> {
  const folderPath = join(dataDirectory, woodFolder)
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: woodFolder,
    file: 'constants.csv',
  })
    .mapErr(toInvalidDataset(woodDataset))
    .andThen((entry) =>
      Result.combine([
        readManifestSourceText({ folderPath, entry, file: harvestFile, dataset: woodDataset }),
        readManifestSourceText({ folderPath, entry, file: productsCarbonFile, dataset: woodDataset }),
      ]),
    )
    .map(([harvestCsv, productsCarbonCsv]) => ({ harvestCsv, productsCarbonCsv }))
}

export { readWoodSources }
export type { WoodSources }
