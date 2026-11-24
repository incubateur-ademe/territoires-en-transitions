import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type LivestockSources = {
  readonly agresteCsv: string
  readonly cartostatCsv: string
}

const regionsDataset = 'elevage-durable/regions'
const livestockFolder = 'elevage-durable'
const agresteFile = 'sources/agreste-ra2020-cheptels-departement-region.csv'
const cartostatFile = 'sources/cartostat-vaches-laitieres-2020-departements-regions.csv'

function readLivestockSources(dataDirectory: string): Result<LivestockSources, InvalidDataset> {
  const folderPath = join(dataDirectory, livestockFolder)
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: livestockFolder,
    file: 'regions.csv',
  })
    .mapErr(toInvalidDataset(regionsDataset))
    .andThen((entry) =>
      Result.combine([
        readManifestSourceText({ folderPath, entry, file: agresteFile, dataset: regionsDataset }),
        readManifestSourceText({ folderPath, entry, file: cartostatFile, dataset: regionsDataset }),
      ]),
    )
    .map(([agresteCsv, cartostatCsv]) => ({ agresteCsv, cartostatCsv }))
}

export { readLivestockSources }
