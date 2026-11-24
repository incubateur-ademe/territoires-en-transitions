import type { Result } from 'neverthrow'
import { match } from 'ts-pattern'
import type {
  DataRow,
  DataSource,
  DataSourceError,
  InvalidDataset,
} from '../../../domain/data-source.ts'
import type { Territory } from '../../../domain/territory.ts'
import type { NitrogenDelivered } from './nitrogen-delivered.ts'
import { readCampaignAverage } from './read-campaign-average.ts'

const regionsDataset = 'fertilisation-azotee/regions'

const departementsDataset = 'fertilisation-azotee/departements'

function toDelivered({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<NitrogenDelivered, InvalidDataset> {
  return readCampaignAverage({ dataset, row }).map((tonnes) => ({ tonnes }))
}

function readNitrogenDelivered({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<'region' | 'departement'>
}): Result<NitrogenDelivered, DataSourceError> {
  return match(territory.level)
    .with('region', () =>
      dataSource
        .row(regionsDataset, territory)
        .andThen((row) => toDelivered({ dataset: regionsDataset, row })),
    )
    .with('departement', () =>
      dataSource
        .row(departementsDataset, territory)
        .andThen((row) => toDelivered({ dataset: departementsDataset, row })),
    )
    .exhaustive()
}

export { readNitrogenDelivered }
