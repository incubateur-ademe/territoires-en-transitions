import { Result } from 'neverthrow'
import { match } from 'ts-pattern'
import {
  type DataRow,
  type DataSource,
  type DataSourceError,
  type InvalidDataset,
} from '../../../domain/data-source.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import { requireQuantityColumn } from '../../../application/require-column.ts'
import type { AgriculturalConsumption } from './agricultural-consumption.ts'
import { findRegionalConsumption, type RegionalEnergy } from './read-regional-energy.ts'

type LocalEnergy = Pick<AgriculturalConsumption, 'electricity' | 'naturalGas'>

const departementsDataset = 'batiments-machines-agricoles/departements'

const epcisDataset = 'batiments-machines-agricoles/epcis'

function toLocalEnergy({
  dataset,
  row,
}: {
  dataset: string
  row: DataRow
}): Result<LocalEnergy, InvalidDataset> {
  return Result.combine([
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'electricity_mwh' }),
    requireQuantityColumn<'MegawattHours'>({ dataset, row, column: 'natural_gas_mwh' }),
  ]).map(([electricity, naturalGas]) => ({ electricity, naturalGas }))
}

function readLocalEnergy({
  dataSource,
  territory,
  regionalEnergy,
}: {
  dataSource: DataSource
  territory: Territory<Level>
  regionalEnergy: RegionalEnergy
}): Result<LocalEnergy, DataSourceError> {
  function readRow(dataset: string): Result<LocalEnergy, DataSourceError> {
    return dataSource.row(dataset, territory).andThen((row) => toLocalEnergy({ dataset, row }))
  }

  return match(territory.level)
    .with('region', () =>
      findRegionalConsumption({ regionalEnergy, region: territory.code }).map(
        ({ electricity, naturalGas }) => ({ electricity, naturalGas }),
      ),
    )
    .with('departement', () => readRow(departementsDataset))
    .with('epci', () => readRow(epcisDataset))
    .exhaustive()
}

export { readLocalEnergy }
