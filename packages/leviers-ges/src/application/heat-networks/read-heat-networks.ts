import { Result } from 'neverthrow'
import type {
  DataRow,
  DataSource,
  DataSourceError,
  InvalidDataset,
} from '../../domain/data-source.ts'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import { requireColumn, requireQuantityColumn } from '../require-column.ts'

const reseauxChaleurNetworksDataset = 'reseaux-chaleur/networks'

function toHeatNetwork({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<HeatNetwork, InvalidDataset> {
  return Result.combine([
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'delivered_mwh' }),
    requireQuantityColumn<'KgCo2ePerKwh'>({ dataset, row, column: 'emission_factor_kg_per_kwh' }),
  ]).map(([deliveredMwh, emissionFactor]) => ({ deliveredMwh, emissionFactor }))
}

function keepHeatNetworksInCommunes({
  dataset,
  communes,
  rows,
}: {
  dataset: string
  communes: ReadonlySet<string>
  rows: readonly DataRow[]
}): Result<readonly HeatNetwork[], InvalidDataset> {
  return Result.combine(
    rows.map((row) =>
      requireColumn({ dataset, row, column: 'commune_code' }).map((commune) => ({
        row,
        commune,
      })),
    ),
  )
    .map((located) => located.filter(({ commune }) => communes.has(commune)).map(({ row }) => row))
    .andThen((rowsInside) => Result.combine(rowsInside.map((row) => toHeatNetwork({ dataset, row }))))
}

function readHeatNetworks({
  dataSource,
  dataset,
  communes,
}: {
  dataSource: DataSource
  dataset: string
  communes: readonly string[]
}): Result<readonly HeatNetwork[], DataSourceError> {
  return dataSource
    .rows(dataset)
    .andThen((rows) => keepHeatNetworksInCommunes({ dataset, communes: new Set(communes), rows }))
}

export { readHeatNetworks, reseauxChaleurNetworksDataset }
