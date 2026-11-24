import { Result } from 'neverthrow'
import { requireQuantityColumn } from '../../../application/require-column.ts'
import type { DataRow, DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import type { Hectares } from '../../../domain/units.ts'
import type { OccupationAreas } from './occupation-data.ts'

const areasDatasets: Readonly<Record<Level, string>> = {
  region: 'occupation-des-sols/regions-surfaces',
  departement: 'occupation-des-sols/departements-surfaces',
  epci: 'occupation-des-sols/epcis-surfaces',
}

function readHectares({
  dataset,
  row,
  column,
}: {
  dataset: string
  row: DataRow
  column: string
}): Result<Hectares, DataSourceError> {
  return requireQuantityColumn<'Hectares'>({ dataset, row, column })
}

function toOccupationAreas({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<OccupationAreas, DataSourceError> {
  return Result.combine([
    readHectares({ dataset, row, column: 'cropland_ha' }),
    readHectares({ dataset, row, column: 'wooded_grassland_ha' }),
    readHectares({ dataset, row, column: 'herbaceous_grassland_ha' }),
    readHectares({ dataset, row, column: 'shrub_grassland_ha' }),
    readHectares({ dataset, row, column: 'forest_mixed_ha' }),
    readHectares({ dataset, row, column: 'forest_broadleaf_ha' }),
    readHectares({ dataset, row, column: 'forest_conifer_ha' }),
    readHectares({ dataset, row, column: 'forest_poplar_ha' }),
    readHectares({ dataset, row, column: 'artificial_shrub_ha' }),
    readHectares({ dataset, row, column: 'artificial_wooded_ha' }),
  ]).map(
    ([
      cropland,
      woodedGrassland,
      herbaceousGrassland,
      shrubGrassland,
      mixedForest,
      broadleafForest,
      coniferForest,
      poplarForest,
      shrubArtificial,
      woodedArtificial,
    ]) => ({
      cropland,
      grassland: { wooded: woodedGrassland, herbaceous: herbaceousGrassland, shrub: shrubGrassland },
      forest: {
        mixed: mixedForest,
        broadleaf: broadleafForest,
        conifer: coniferForest,
        poplar: poplarForest,
      },
      artificial: { shrub: shrubArtificial, wooded: woodedArtificial },
    }),
  )
}

function readOccupationAreas({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<Level>
}): Result<OccupationAreas, DataSourceError> {
  const dataset = areasDatasets[territory.level]
  return dataSource.row(dataset, territory).andThen((row) => toOccupationAreas({ dataset, row }))
}

export { readOccupationAreas }
