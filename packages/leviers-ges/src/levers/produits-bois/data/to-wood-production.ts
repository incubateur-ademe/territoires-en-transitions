import { Result } from 'neverthrow'
import { requireQuantityColumn } from '../../../application/require-column.ts'
import type { DataRow, InvalidDataset } from '../../../domain/data-source.ts'
import type { WoodProduction } from './wood-production.ts'

function toWoodProduction({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<WoodProduction, InvalidDataset> {
  return Result.combine([
    requireQuantityColumn<'ThousandCubicMetres'>({
      dataset,
      row,
      column: 'logs_thousand_m3',
    }),
    requireQuantityColumn<'ThousandCubicMetres'>({
      dataset,
      row,
      column: 'industrial_wood_thousand_m3',
    }),
  ]).map(([logs, industrialWood]) => ({ logs, industrialWood }))
}

export { toWoodProduction }
