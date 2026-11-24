import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'

type WasteSources = {
  readonly irepCsv: string
  readonly emissionFactorsText: string
}

const flowsDataset = 'dechets/treatment-flows'
const wasteFolder = 'dechets'
const irepFile = 'sources/irep-2022-dechets-municipaux-traitement.csv'
const emissionFactorsFile = 'sources/fe-dechets-tableur.csv'

function readWasteSources(dataDirectory: string): Result<WasteSources, InvalidDataset> {
  const folderPath = join(dataDirectory, wasteFolder)
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: wasteFolder,
    file: 'treatment-flows.csv',
  })
    .mapErr(toInvalidDataset(flowsDataset))
    .andThen((entry) =>
      Result.combine([
        readManifestSourceText({ folderPath, entry, file: irepFile, dataset: flowsDataset }),
        readManifestSourceText({
          folderPath,
          entry,
          file: emissionFactorsFile,
          dataset: flowsDataset,
        }),
      ]),
    )
    .map(([irepCsv, emissionFactorsText]) => ({ irepCsv, emissionFactorsText }))
}

export { readWasteSources }
