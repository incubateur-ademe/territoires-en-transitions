import type { Result } from 'neverthrow'
import { match } from 'ts-pattern'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { ComputedLevels } from '../../../domain/lever-registry.ts'
import type { Territory } from '../../../domain/territory.ts'
import { readEpciWoodProduction } from './read-epci-wood-production.ts'
import { toWoodProduction } from './to-wood-production.ts'
import type { WoodProduction } from './wood-production.ts'

const regionsDataset = 'produits-bois/regions'

const departementsDataset = 'produits-bois/departements'

function readRow({
  dataSource,
  dataset,
  territory,
}: {
  dataSource: DataSource
  dataset: string
  territory: Territory<'region' | 'departement'>
}): Result<WoodProduction, DataSourceError> {
  return dataSource.row(dataset, territory).andThen((row) => toWoodProduction({ dataset, row }))
}

function readTerritoryWoodProduction({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<ComputedLevels<'produits_bois'>>
}): Result<WoodProduction, DataSourceError> {
  return match(territory)
    .with({ level: 'epci' }, (epci) => readEpciWoodProduction({ dataSource, territory: epci }))
    .with({ level: 'region' }, (region) =>
      readRow({ dataSource, dataset: regionsDataset, territory: region }),
    )
    .with({ level: 'departement' }, (departement) =>
      readRow({ dataSource, dataset: departementsDataset, territory: departement }),
    )
    .exhaustive()
}

export { readTerritoryWoodProduction }
