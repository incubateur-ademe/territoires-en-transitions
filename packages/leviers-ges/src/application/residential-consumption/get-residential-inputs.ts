import type { Result } from 'neverthrow'
import { readHeatNetworks } from '../heat-networks/read-heat-networks.ts'
import { weightHeatEmissionFactor } from '../heat-networks/weight-heat-emission-factor.ts'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { Level, Territory } from '../../domain/territory.ts'
import type { KgCo2ePerKwh } from '../../domain/units.ts'
import { readResidentialConsumption } from './read-residential-consumption.ts'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'

const residentialHeatNetworksDataset = 'residentiel-sobriete/heat-networks'

type ResidentialInputs = {
  readonly consumption: ResidentialConsumption
  readonly heatEmissionFactor: KgCo2ePerKwh
}

function getResidentialInputs({
  dataSource,
  territory,
  communes,
}: {
  dataSource: DataSource
  territory: Territory<Level>
  communes: readonly string[]
}): Result<ResidentialInputs, DataSourceError> {
  return readHeatNetworks({ dataSource, dataset: residentialHeatNetworksDataset, communes }).andThen(
    (networks) =>
      readResidentialConsumption({ dataSource, territory, networks }).map((consumption) => ({
        consumption,
        heatEmissionFactor: weightHeatEmissionFactor(networks),
      })),
  )
}

export { getResidentialInputs }
