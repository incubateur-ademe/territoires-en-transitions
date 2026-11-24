import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type OrganicSources = {
  readonly epciOrganicCsv: string
  readonly departementOrganicCsv: string
}

const epcisDataset = 'fertilisation-azotee/organic-epci-departements'
const departementsDataset = 'fertilisation-azotee/organic-departements'
const organicFolder = 'fertilisation-azotee'
const epciOrganicFile = 'sources/agence-bio-surfaces-epci-2024.csv'
const departementOrganicFile = 'sources/agence-bio-surfaces-departements-2024.csv'

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
  return findDatasetEntry({ rootDirectory: dataDirectory, folder: organicFolder, file })
    .mapErr(toInvalidDataset(dataset))
    .andThen((entry) =>
      readManifestSourceText({
        folderPath: join(dataDirectory, organicFolder),
        entry,
        file: sourceFile,
        dataset,
      }),
    )
}

function readOrganicSources(dataDirectory: string): Result<OrganicSources, InvalidDataset> {
  return Result.combine([
    readSource({
      dataDirectory,
      dataset: epcisDataset,
      file: 'organic-epci-departements.csv',
      sourceFile: epciOrganicFile,
    }),
    readSource({
      dataDirectory,
      dataset: departementsDataset,
      file: 'organic-departements.csv',
      sourceFile: departementOrganicFile,
    }),
  ]).map(([epciOrganicCsv, departementOrganicCsv]) => ({ epciOrganicCsv, departementOrganicCsv }))
}

export { departementsDataset, epcisDataset, readOrganicSources }
export type { OrganicSources }
