import { Result } from 'neverthrow'
import { requireQuantityColumn } from '../../../application/require-column.ts'
import type { DataRow, DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import type { Quantity, TCo2ePerHectarePerYear, UnitName } from '../../../domain/units.ts'
import type { ForestFactors, OccupationFactors } from './occupation-data.ts'

const factorsDatasets: Readonly<Record<Level, string>> = {
  region: 'occupation-des-sols/regions-facteurs',
  departement: 'occupation-des-sols/departements-facteurs',
  epci: 'occupation-des-sols/epcis-facteurs',
}

function readFactor<U extends UnitName>({
  dataset,
  row,
  column,
}: {
  dataset: string
  row: DataRow
  column: string
}): Result<Quantity<U>, DataSourceError> {
  return requireQuantityColumn<U>({ dataset, row, column })
}

function toForestFactors({
  dataset,
  row,
  grassland,
}: {
  dataset: string
  row: DataRow
  grassland: 'wooded' | 'herbaceous' | 'shrub'
}): Result<ForestFactors<TCo2ePerHectarePerYear>, DataSourceError> {
  return Result.combine([
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: `${grassland}_grassland_to_forest_mixed` }),
    readFactor<'TCo2ePerHectarePerYear'>({
      dataset,
      row,
      column: `${grassland}_grassland_to_forest_broadleaf`,
    }),
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: `${grassland}_grassland_to_forest_conifer` }),
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: `${grassland}_grassland_to_forest_poplar` }),
  ]).map(([mixed, broadleaf, conifer, poplar]) => ({ mixed, broadleaf, conifer, poplar }))
}

function toOccupationFactors({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<OccupationFactors, DataSourceError> {
  return Result.combine([
    toForestFactors({ dataset, row, grassland: 'wooded' }),
    toForestFactors({ dataset, row, grassland: 'herbaceous' }),
    toForestFactors({ dataset, row, grassland: 'shrub' }),
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: 'cropland_to_wetland' }),
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: 'wooded_grassland_to_wetland' }),
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: 'herbaceous_grassland_to_wetland' }),
    readFactor<'TCo2ePerHectarePerYear'>({ dataset, row, column: 'shrub_grassland_to_wetland' }),
    readFactor<'TCo2ePerHectare'>({ dataset, row, column: 'impervious_to_artificial_shrub' }),
    readFactor<'TCo2ePerHectare'>({ dataset, row, column: 'impervious_to_artificial_wooded' }),
  ]).map(
    ([
      wooded,
      herbaceous,
      shrub,
      croplandToWetland,
      woodedToWetland,
      herbaceousToWetland,
      shrubToWetland,
      imperviousToShrub,
      imperviousToWooded,
    ]) => ({
      grasslandToForest: { wooded, herbaceous, shrub },
      toWetland: {
        cropland: croplandToWetland,
        grassland: { wooded: woodedToWetland, herbaceous: herbaceousToWetland, shrub: shrubToWetland },
      },
      imperviousToArtificial: { shrub: imperviousToShrub, wooded: imperviousToWooded },
    }),
  )
}

function readOccupationFactors({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<Level>
}): Result<OccupationFactors, DataSourceError> {
  const dataset = factorsDatasets[territory.level]
  return dataSource.row(dataset, territory).andThen((row) => toOccupationFactors({ dataset, row }))
}

export { readOccupationFactors }
