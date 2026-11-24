import { resolve } from 'node:path'
import { err, ok, type Result } from 'neverthrow'
import {
  invalidDataset,
  missingData,
  type DataRow,
  type DataSource,
  type DataSourceError,
  type InvalidDataset,
} from '../../domain/data-source.ts'
import { loadDataset, type Dataset } from './load-dataset.ts'

const valueColumn = 'value'

function createCsvDataSource(rootDirectory: string): DataSource {
  const absoluteRoot = resolve(rootDirectory)
  const loadedDatasets = new Map<string, Result<Dataset, InvalidDataset>>()

  function dataset(name: string): Result<Dataset, InvalidDataset> {
    const cached = loadedDatasets.get(name)
    if (cached !== undefined) return cached
    const loaded = loadDataset({ rootDirectory: absoluteRoot, name })
    const isTransientFailure = loaded.isErr() && loaded.error.reason === 'unreadable'
    if (!isTransientFailure) loadedDatasets.set(name, loaded)
    return loaded
  }

  function findRow({
    name,
    rows,
    key,
  }: {
    name: string
    rows: ReadonlyMap<string, DataRow>
    key: string
  }): Result<DataRow, DataSourceError> {
    const row = rows.get(key)
    return row === undefined ? err(missingData({ dataset: name, key })) : ok(row)
  }

  return {
    provenance: (name) => dataset(name).map(({ provenance }) => provenance),
    constant: (name, constantName) =>
      dataset(name)
        .andThen(({ rows }) => findRow({ name, rows, key: constantName }))
        .andThen((row) => {
          const value = row[valueColumn]
          const isBlank = value === undefined || value === ''
          return isBlank ? err(missingData({ dataset: name, key: constantName })) : ok(value)
        }),
    rows: (name) => dataset(name).map(({ rows }) => [...rows.values()]),
    row: (name, territory) =>
      dataset(name).andThen(({ level, rows }) =>
        level === territory.level
          ? findRow({ name, rows, key: territory.code })
          : err(
              invalidDataset({
                dataset: name,
                reason: 'level_mismatch',
                detail: `expected ${String(level)}, got ${territory.level}`,
              }),
            ),
      ),
  }
}

export { createCsvDataSource }
