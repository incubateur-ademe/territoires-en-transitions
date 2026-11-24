import { join } from 'node:path'
import type { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type NitrogenSources = {
  readonly deliveriesCsv: string
}

const regionsDataset = 'fertilisation-azotee/regions'
const nitrogenFolder = 'fertilisation-azotee'
const deliveriesFile = 'sources/unifa-azote-2023-2024.csv'

function readNitrogenSources(dataDirectory: string): Result<NitrogenSources, InvalidDataset> {
  const folderPath = join(dataDirectory, nitrogenFolder)
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: nitrogenFolder,
    file: 'regions.csv',
  })
    .mapErr(toInvalidDataset(regionsDataset))
    .andThen((entry) =>
      readManifestSourceText({
        folderPath,
        entry,
        file: deliveriesFile,
        dataset: regionsDataset,
      }),
    )
    .map((deliveriesCsv) => ({ deliveriesCsv }))
}

export { readNitrogenSources }
