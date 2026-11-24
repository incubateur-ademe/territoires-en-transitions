import { join } from 'node:path'
import { err, ok, type Result } from 'neverthrow'
import type { DataRow, DatasetProvenance, InvalidDataset } from '../../domain/data-source.ts'
import { findDatasetEntry } from './manifest.ts'
import { parseCsvText } from './parse-csv-text.ts'
import { readVerifiedText } from './read-verified-file.ts'
import type { Level } from '../../domain/territory.ts'
import {
  checkCells,
  checkColumns,
  checkControlTotals,
  checkNotEmpty,
  indexByKey,
} from './validate-rows.ts'
import { toInvalidDataset, violation, type Violation } from './violation.ts'

type Dataset = {
  readonly level: Level | undefined
  readonly rows: ReadonlyMap<string, DataRow>
  readonly provenance: DatasetProvenance
}

const datasetNamePattern = /^([a-z0-9-]+)\/([a-z0-9-]+)$/

function parseCsv(text: string): Result<readonly DataRow[], Violation> {
  return parseCsvText({ text, delimiter: ',' })
}

function splitDatasetName(name: string): Result<{ folder: string; file: string }, Violation> {
  const match = datasetNamePattern.exec(name)
  const [, folder, file] = match ?? []
  return folder === undefined || file === undefined
    ? err(violation('unknown_dataset', name))
    : ok({ folder, file: `${file}.csv` })
}

function loadDataset({
  rootDirectory,
  name,
}: {
  rootDirectory: string
  name: string
}): Result<Dataset, InvalidDataset> {
  return splitDatasetName(name)
    .andThen(({ folder, file }) =>
      findDatasetEntry({ rootDirectory, folder, file }).map((entry) => ({ entry, folder })),
    )
    .andThen(({ entry, folder }) =>
      readVerifiedText({
        path: join(rootDirectory, folder, entry.file),
        expectedChecksum: entry.checksum,
      })
        .andThen(parseCsv)
        .andThen(checkNotEmpty)
        .andThen((rows) => checkColumns(rows, entry))
        .andThen(checkCells)
        .andThen((rows) => checkControlTotals(rows, entry.controlTotals ?? {}))
        .andThen((rows) => indexByKey(rows, entry.keyColumn))
        .map(
          (rows): Dataset => ({
            level: entry.level,
            rows,
            provenance: {
              dataset: name,
              source: entry.source,
              vintage: entry.vintage,
              retrievedOn: entry.retrievedOn,
            },
          }),
        ),
    )
    .mapErr(toInvalidDataset(name))
}

export { loadDataset }
export type { Dataset }
