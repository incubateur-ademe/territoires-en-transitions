import { Result } from 'neverthrow'
import type { DepartementLookup } from '../../../application/estimate/estimation-context.ts'
import { memoizeOkByReferences } from '../../../application/memoize-ok-by-references.ts'
import { requireNonEmptyColumn, requireQuantityColumn } from '../../../application/require-column.ts'
import type { DataRow, DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Hectares } from '../../../domain/units.ts'

const agriculturalAreaDataset = 'surface-agricole-utile/communes'

type LocatedArea = {
  readonly commune: string
  readonly departement: string
  readonly hectares: Hectares
}

function toLocatedArea({
  row,
  getDepartementByCommune,
}: {
  row: DataRow
  getDepartementByCommune: DepartementLookup
}): Result<readonly LocatedArea[], DataSourceError> {
  const dataset = agriculturalAreaDataset
  return Result.combine([
    requireNonEmptyColumn({ dataset, row, column: 'code_commune' }),
    requireQuantityColumn<'Hectares'>({ dataset, row, column: 'agricultural_area_ha' }),
  ]).andThen(([commune, hectares]) =>
    getDepartementByCommune(commune).map((departement) =>
      departement === undefined ? [] : [{ commune, departement, hectares }],
    ),
  )
}

const locateAreas = memoizeOkByReferences(
  (
    dataSource: DataSource,
    getDepartementByCommune: DepartementLookup,
  ): Result<readonly LocatedArea[], DataSourceError> =>
    dataSource
      .rows(agriculturalAreaDataset)
      .andThen((rows) =>
        Result.combine(rows.map((row) => toLocatedArea({ row, getDepartementByCommune }))),
      )
      .map((located) => located.flat()),
)

function readLocatedAreas({
  dataSource,
  getDepartementByCommune,
}: {
  dataSource: DataSource
  getDepartementByCommune: DepartementLookup
}): Result<readonly LocatedArea[], DataSourceError> {
  return locateAreas(dataSource, getDepartementByCommune)
}

export { readLocatedAreas }
export type { LocatedArea }
