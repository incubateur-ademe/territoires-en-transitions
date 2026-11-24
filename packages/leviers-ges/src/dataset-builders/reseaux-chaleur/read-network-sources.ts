import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type NetworkSources = {
  readonly sdesCsv: string
  readonly fcuCsv: string
}

const networksDataset = 'reseaux-chaleur/networks'
const networksFolder = 'reseaux-chaleur'
const sdesFile = 'sources/sdes-chaleur-commune-2024.csv'
const fcuFile = 'sources/fcu-reseaux-chaleur.csv'

function readNetworkSources(dataDirectory: string): Result<NetworkSources, InvalidDataset> {
  const folderPath = join(dataDirectory, networksFolder)
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: networksFolder,
    file: 'networks.csv',
  })
    .mapErr(toInvalidDataset(networksDataset))
    .andThen((entry) =>
      Result.combine([
        readManifestSourceText({ folderPath, entry, file: sdesFile, dataset: networksDataset }),
        readManifestSourceText({ folderPath, entry, file: fcuFile, dataset: networksDataset }),
      ]),
    )
    .map(([sdesCsv, fcuCsv]) => ({ sdesCsv, fcuCsv }))
}

export { readNetworkSources }
export type { NetworkSources }
