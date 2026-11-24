import type { Result } from 'neverthrow'
import { match } from 'ts-pattern'
import type { DataRow, DataSource, DataSourceError } from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'

type TransportRow = {
  readonly dataset: string
  readonly row: DataRow
}

const regionsDataset = 'transport-personnes/regions'

const departementsDataset = 'transport-personnes/departements'

const epcisDataset = 'transport-personnes/epcis'

function toTransportRow(dataset: string): (row: DataRow) => TransportRow {
  return (row) => ({ dataset, row })
}

function readTransportRow({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<Level>
}): Result<TransportRow, DataSourceError> {
  return match(territory.level)
    .with('region', () => dataSource.row(regionsDataset, territory).map(toTransportRow(regionsDataset)))
    .with('departement', () =>
      dataSource.row(departementsDataset, territory).map(toTransportRow(departementsDataset)),
    )
    .with('epci', () => dataSource.row(epcisDataset, territory).map(toTransportRow(epcisDataset)))
    .exhaustive()
}

export { readTransportRow }
export type { TransportRow }
