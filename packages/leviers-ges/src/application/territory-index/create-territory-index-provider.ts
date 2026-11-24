import { ok, type Result } from 'neverthrow'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { TerritoryIndex } from '../../domain/territory-index.ts'
import { loadTerritoryIndex } from './load-territory-index.ts'

function createTerritoryIndexProvider(
  dataSource: DataSource,
): () => Result<TerritoryIndex, DataSourceError> {
  let builtIndex: TerritoryIndex | undefined

  return () => {
    if (builtIndex !== undefined) return ok(builtIndex)
    return loadTerritoryIndex(dataSource).map((index) => {
      builtIndex = index
      return index
    })
  }
}

export { createTerritoryIndexProvider }
