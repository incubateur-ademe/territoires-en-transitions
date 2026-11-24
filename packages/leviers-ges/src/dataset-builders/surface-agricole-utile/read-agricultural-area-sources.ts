import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { DataSourceError } from '../../domain/data-source.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import type { AgriculturalAreaSources } from './build-agricultural-area.ts'

const datasetFolder = 'surface-agricole-utile'
const datasetName = 'surface-agricole-utile/communes'
const communeFile = 'sources/sau-commune.csv'
const regionFile = 'sources/sau-region.csv'
const departementFile = 'sources/sau-departement.csv'

function readAgriculturalAreaSources(
  dataDirectory: string,
): Result<AgriculturalAreaSources, DataSourceError> {
  const folderPath = join(dataDirectory, datasetFolder)
  return findDatasetEntry({ rootDirectory: dataDirectory, folder: datasetFolder, file: 'communes.csv' })
    .mapErr(toInvalidDataset(datasetName))
    .andThen((entry) =>
      Result.combine([
        readManifestSourceText({ folderPath, entry, file: communeFile, dataset: datasetName }),
        readManifestSourceText({ folderPath, entry, file: regionFile, dataset: datasetName }),
        readManifestSourceText({ folderPath, entry, file: departementFile, dataset: datasetName }),
      ]),
    )
    .andThen(([communeCsv, regionCsv, departementCsv]) =>
      createCsvDataSource(dataDirectory)
        .rows('territoires/communes')
        .map((communes) => ({ communeCsv, regionCsv, departementCsv, communes })),
    )
}

export { readAgriculturalAreaSources }
