import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type OccupationSources = {
  readonly surfacesCsv: string
  readonly factorsCsv: string
  readonly factorSetsCsv: string
}

const surfacesDataset = 'occupation-des-sols/epcis-surfaces'
const factorsDataset = 'occupation-des-sols/epcis-facteurs'
const occupationFolder = 'occupation-des-sols'
const surfacesFile = 'sources/aldo-stocks-carbone-communes-surfaces.csv'
const factorsFile = 'sources/aldo-flux2-epci-facteurs.csv'
const factorSetsFile = 'sources/aldo-flux2-communes-jeux-de-facteurs.csv'
const departementFactorsDataset = 'occupation-des-sols/departements-facteurs'

function readSource({
  dataDirectory,
  dataset,
  file,
  sourceFile,
}: {
  dataDirectory: string
  dataset: string
  file: string
  sourceFile: string
}): Result<string, InvalidDataset> {
  return findDatasetEntry({ rootDirectory: dataDirectory, folder: occupationFolder, file })
    .mapErr(toInvalidDataset(dataset))
    .andThen((entry) =>
      readManifestSourceText({
        folderPath: join(dataDirectory, occupationFolder),
        entry,
        file: sourceFile,
        dataset,
      }),
    )
}

function readOccupationSources(dataDirectory: string): Result<OccupationSources, InvalidDataset> {
  return Result.combine([
    readSource({
      dataDirectory,
      dataset: surfacesDataset,
      file: 'epcis-surfaces.csv',
      sourceFile: surfacesFile,
    }),
    readSource({
      dataDirectory,
      dataset: factorsDataset,
      file: 'epcis-facteurs.csv',
      sourceFile: factorsFile,
    }),
    readSource({
      dataDirectory,
      dataset: departementFactorsDataset,
      file: 'departements-facteurs.csv',
      sourceFile: factorSetsFile,
    }),
  ]).map(([surfacesCsv, factorsCsv, factorSetsCsv]) => ({ surfacesCsv, factorsCsv, factorSetsCsv }))
}

export { factorsDataset, readOccupationSources, surfacesDataset }
export type { OccupationSources }
