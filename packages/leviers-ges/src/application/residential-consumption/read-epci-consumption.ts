import { Result, err, ok } from 'neverthrow'
import {
  requireNonEmptyColumn,
  requireQuantityColumn,
} from '../require-column.ts'
import { sum } from '../../domain/big-number.ts'
import {
  invalidDataset,
  missingData,
  type DataRow,
  type DataSource,
  type DataSourceError,
  type InvalidDataset,
} from '../../domain/data-source.ts'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import type { Territory } from '../../domain/territory.ts'
import { quantity, type MegawattHours, type SquareMetres } from '../../domain/units.ts'
import { apportionBySurface, type SurfaceContribution } from './calculate-surface-apportionment.ts'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'

type Vector = 'fuel_oil' | 'lpg'

type EpciDepartement = {
  readonly departement: string
  readonly epciRow: DataRow
  readonly departementHousing: DataRow
  readonly departementConsumption: DataRow
}

const epcisDataset = 'residentiel-sobriete/epcis'

const epciHousingDataset = 'residentiel-logements/logements-epci-departement'

const departementHousingDataset = 'residentiel-logements/logements-departement'

const departementsDataset = 'residentiel-sobriete/departements'

// Source : data/residentiel-logements/manifest.json : types de logement des colonnes housing_m2_<type>_<combustible>_<période>
const HOUSING_TYPES = ['house', 'private_apartment', 'social_apartment'] as const

// Source : data/residentiel-logements/manifest.json : périodes de construction des colonnes housing_m2_<type>_<combustible>_<période>
const CONSTRUCTION_PERIODS = ['before_1971', '1971_to_2005', 'after_2005'] as const

function housingColumns(vector: Vector): readonly string[] {
  return HOUSING_TYPES.flatMap((type) =>
    CONSTRUCTION_PERIODS.map((period) => `housing_m2_${type}_${vector}_${period}`),
  )
}

function readSurface({
  dataset,
  row,
  vector,
}: {
  dataset: string
  row: DataRow
  vector: Vector
}): Result<SquareMetres, InvalidDataset> {
  return Result.combine(
    housingColumns(vector).map((column) =>
      requireQuantityColumn<'SquareMetres'>({ dataset, row, column }),
    ),
  ).map((surfaces) => quantity<'SquareMetres'>(sum(surfaces).toFixed()))
}

function findDepartementRow({
  dataset,
  rows,
  departement,
}: {
  dataset: string
  rows: readonly DataRow[]
  departement: string
}): Result<DataRow, DataSourceError> {
  const found = rows.find((row) => row['code_departement'] === departement)
  return found === undefined ? err(missingData({ dataset, key: departement })) : ok(found)
}

function toContribution({
  epciDepartement,
  vector,
  consumptionColumn,
}: {
  epciDepartement: EpciDepartement
  vector: Vector
  consumptionColumn: string
}): Result<SurfaceContribution, DataSourceError> {
  const { departement, epciRow, departementHousing, departementConsumption } = epciDepartement
  return Result.combine([
    readSurface({ dataset: epciHousingDataset, row: epciRow, vector }),
    readSurface({ dataset: departementHousingDataset, row: departementHousing, vector }),
    requireQuantityColumn<'MegawattHours'>({
      dataset: departementsDataset,
      row: departementConsumption,
      column: consumptionColumn,
    }),
  ]).andThen(([epciSurface, departementSurface, consumption]) =>
    epciSurface.isGreaterThan(departementSurface)
      ? err(
          invalidDataset({
            dataset: epciHousingDataset,
            reason: 'control_total_mismatch',
            detail: `${departement}: ${vector} surface ${epciSurface.toFixed()} exceeds the department's ${departementSurface.toFixed()}`,
          }),
        )
      : ok({ epciSurface, departementSurface, departementConsumption: consumption }),
  )
}

function readEpciHousingRows({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<'epci'>
}): Result<readonly DataRow[], DataSourceError> {
  return dataSource.rows(epciHousingDataset).andThen((rows) => {
    const epciRows = rows.filter((row) => row['code_epci'] === territory.code)
    return epciRows.length === 0
      ? err(missingData({ dataset: epciHousingDataset, key: territory.code }))
      : ok(epciRows)
  })
}

function apportionFuel({
  epciDepartements,
  vector,
  consumptionColumn,
}: {
  epciDepartements: readonly EpciDepartement[]
  vector: Vector
  consumptionColumn: string
}): Result<MegawattHours, DataSourceError> {
  return Result.combine(
    epciDepartements.map((epciDepartement) =>
      toContribution({ epciDepartement, vector, consumptionColumn }),
    ),
  ).map(apportionBySurface)
}

function readEpciDepartements({
  dataSource,
  epciRows,
}: {
  dataSource: DataSource
  epciRows: readonly DataRow[]
}): Result<readonly EpciDepartement[], DataSourceError> {
  return Result.combine([
    dataSource.rows(departementHousingDataset),
    dataSource.rows(departementsDataset),
  ]).andThen(([housingRows, consumptionRows]) =>
    Result.combine(
      epciRows.map((epciRow) =>
        requireNonEmptyColumn({
          dataset: epciHousingDataset,
          row: epciRow,
          column: 'code_departement',
        }).andThen((departement) =>
          Result.combine([
            findDepartementRow({
              dataset: departementHousingDataset,
              rows: housingRows,
              departement,
            }),
            findDepartementRow({
              dataset: departementsDataset,
              rows: consumptionRows,
              departement,
            }),
          ]).map(([departementHousing, departementConsumption]) => ({
            departement,
            epciRow,
            departementHousing,
            departementConsumption,
          })),
        ),
      ),
    ),
  )
}

function readEpciConsumption({
  dataSource,
  territory,
  networks,
}: {
  dataSource: DataSource
  territory: Territory<'epci'>
  networks: readonly HeatNetwork[]
}): Result<ResidentialConsumption, DataSourceError> {
  const heat = quantity<'MegawattHours'>(
    sum(networks.map(({ deliveredMwh }) => deliveredMwh)).toFixed(),
  )
  return Result.combine([
    dataSource.row(epcisDataset, territory),
    readEpciHousingRows({ dataSource, territory }),
  ]).andThen(([epciRow, epciRows]) =>
    readEpciDepartements({ dataSource, epciRows }).andThen((epciDepartements) =>
      Result.combine([
        requireQuantityColumn<'MegawattHours'>({
          dataset: epcisDataset,
          row: epciRow,
          column: 'electricity_mwh',
        }),
        requireQuantityColumn<'MegawattHours'>({
          dataset: epcisDataset,
          row: epciRow,
          column: 'natural_gas_mwh',
        }),
        apportionFuel({ epciDepartements, vector: 'fuel_oil', consumptionColumn: 'fuel_oil_mwh' }),
        apportionFuel({ epciDepartements, vector: 'lpg', consumptionColumn: 'lpg_mwh' }),
      ]).map(([electricity, naturalGas, fuelOil, liquefiedPetroleumGas]) => ({
        electricity,
        naturalGas,
        fuelOil,
        liquefiedPetroleumGas,
        heat,
      })),
    ),
  )
}

export { readEpciConsumption }
