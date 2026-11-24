import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import type { EpciConsumptionSources } from './build-epci-consumption.ts'

const datasetFolder = 'residentiel-sobriete'

const epciElectricityFile = 'sources/sdes-electricite-epci-2024-residentiel.csv'

const epciGasFile = 'sources/sdes-gaz-epci-2024-residentiel.csv'

function readEpciSources(dataDirectory: string): Result<EpciConsumptionSources, InvalidDataset> {
  const dataset = `${datasetFolder}/epcis.csv`
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: datasetFolder,
    file: 'epcis.csv',
  })
    .mapErr(toInvalidDataset(dataset))
    .andThen((entry) => {
      const readSource = (file: string) =>
        readManifestSourceText({
          folderPath: join(dataDirectory, datasetFolder),
          entry,
          file,
          dataset: `${datasetFolder}/${file}`,
        })
      return Result.combine([readSource(epciElectricityFile), readSource(epciGasFile)])
    })
    .map(([epciElectricityCsv, epciGasCsv]) => ({ epciElectricityCsv, epciGasCsv }))
}

export { readEpciSources }
