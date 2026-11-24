import { Result } from 'neverthrow'
import type { DataRow, DataSource, DataSourceError, InvalidDataset } from '../../domain/data-source.ts'
import { buildTerritoryIndex, type Commune, type TerritoryIndex } from '../../domain/territory-index.ts'
import { requireColumn, requireNonEmptyColumn } from '../require-column.ts'

const communesDataset = 'territoires/communes'

function toCommune(row: DataRow): Result<Commune, InvalidDataset> {
  const dataset = communesDataset
  return Result.combine([
    requireNonEmptyColumn({ dataset, row, column: 'code_commune' }),
    requireColumn({ dataset, row, column: 'code_epci' }),
    requireNonEmptyColumn({ dataset, row, column: 'code_departement' }),
    requireNonEmptyColumn({ dataset, row, column: 'code_region' }),
  ]).map(([code, epci, departement, region]) => ({
    code,
    epci: epci === '' ? undefined : epci,
    departement,
    region,
  }))
}

function loadTerritoryIndex(dataSource: DataSource): Result<TerritoryIndex, DataSourceError> {
  return dataSource
    .rows(communesDataset)
    .andThen((rows) => Result.combine(rows.map(toCommune)))
    .map(buildTerritoryIndex)
}

export { loadTerritoryIndex }
