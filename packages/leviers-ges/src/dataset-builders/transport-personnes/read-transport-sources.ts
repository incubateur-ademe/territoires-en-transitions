import { join } from 'node:path'
import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from '../../infrastructure/csv/manifest.ts'
import { readManifestSourceText } from '../../infrastructure/csv/read-manifest-source.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { commutingDataset } from './read-commuting-passenger-km.ts'
import { fleetDataset } from './read-fleet.ts'

type TransportSources = {
  readonly commutingCsv: string
  readonly fleetCsv: string
}

const manifestDataset = 'transport-personnes/regions'
const transportFolder = 'transport-personnes'
const commutingFile = 'sources/insee-sdes-domicile-travail-2022-agregats-par-mode.csv'
const fleetFile = 'sources/sdes-parc-vp-tc-routier-2025-par-maille.csv'

function readTransportSources(dataDirectory: string): Result<TransportSources, InvalidDataset> {
  const folderPath = join(dataDirectory, transportFolder)
  return findDatasetEntry({
    rootDirectory: dataDirectory,
    folder: transportFolder,
    file: 'regions.csv',
  })
    .mapErr(toInvalidDataset(manifestDataset))
    .andThen((entry) =>
      Result.combine([
        readManifestSourceText({ folderPath, entry, file: commutingFile, dataset: commutingDataset }),
        readManifestSourceText({ folderPath, entry, file: fleetFile, dataset: fleetDataset }),
      ]),
    )
    .map(([commutingCsv, fleetCsv]) => ({ commutingCsv, fleetCsv }))
}

export { readTransportSources }
export type { TransportSources }
