import type { Result } from 'neverthrow'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { KgCo2ePerKwh } from '../../domain/units.ts'
import { readHeatNetworks } from './read-heat-networks.ts'
import { weightHeatEmissionFactor } from './weight-heat-emission-factor.ts'

function readHeatEmissionFactor({
  dataSource,
  dataset,
  communes,
}: {
  dataSource: DataSource
  dataset: string
  communes: readonly string[]
}): Result<KgCo2ePerKwh, DataSourceError> {
  return readHeatNetworks({ dataSource, dataset, communes }).map(weightHeatEmissionFactor)
}

export { readHeatEmissionFactor }
