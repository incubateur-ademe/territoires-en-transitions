import { Result } from 'neverthrow'
import type { RegionLookup } from '../../../application/estimate/estimation-context.ts'
import type { DataRow, DataSource, DataSourceError } from '../../../domain/data-source.ts'
import { memoizeOkByReferences } from '../../../application/memoize-ok-by-references.ts'
import { requireNonEmptyColumn, requireQuantityColumn } from '../../../application/require-column.ts'
import type { LocatedArea } from './calculate-regional-area-shares.ts'

type LocatableArea = Omit<LocatedArea, 'region'> & { readonly region: string | undefined }

const areasDataset = 'surface-agricole-utile/communes'

function hasRegion(area: LocatableArea): area is LocatedArea {
  return area.region !== undefined
}

function toLocatableArea({
  row,
  getRegionByCommune,
}: {
  row: DataRow
  getRegionByCommune: RegionLookup
}): Result<LocatableArea, DataSourceError> {
  const dataset = areasDataset
  return Result.combine([
    requireNonEmptyColumn({ dataset, row, column: 'code_commune' }),
    requireQuantityColumn<'Hectares'>({ dataset, row, column: 'agricultural_area_ha' }),
  ]).andThen(([commune, hectares]) =>
    getRegionByCommune(commune).map((region) => ({ commune, region, hectares })),
  )
}

const locateAreas = memoizeOkByReferences(
  (
    dataSource: DataSource,
    getRegionByCommune: RegionLookup,
  ): Result<readonly LocatedArea[], DataSourceError> =>
    dataSource
      .rows(areasDataset)
      .andThen((rows) => Result.combine(rows.map((row) => toLocatableArea({ row, getRegionByCommune }))))
      .map((areas) => areas.filter(hasRegion)),
)

function readLocatedAreas({
  dataSource,
  getRegionByCommune,
}: {
  dataSource: DataSource
  getRegionByCommune: RegionLookup
}): Result<readonly LocatedArea[], DataSourceError> {
  return locateAreas(dataSource, getRegionByCommune)
}

export { readLocatedAreas }
