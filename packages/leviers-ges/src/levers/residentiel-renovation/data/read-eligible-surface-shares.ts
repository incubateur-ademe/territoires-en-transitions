import { Result, err, ok } from 'neverthrow'
import { match } from 'ts-pattern'
import { requireQuantityColumn } from '../../../application/require-column.ts'
import type { DepartementLookup } from '../../../application/estimate/estimation-context.ts'
import { sum } from '../../../domain/big-number.ts'
import {
  missingData,
  type DataRow,
  type DataSource,
  type DataSourceError,
} from '../../../domain/data-source.ts'
import type { ResidentialEnergyVector } from '../../../domain/residential-heating-shares.ts'
import type { Level, Territory } from '../../../domain/territory.ts'
import { quantity, type Fraction, type SquareMetres } from '../../../domain/units.ts'

type SurfaceCell = { readonly type: string; readonly period: string }

const departementsDataset = 'residentiel-logements/logements-departement'

const epcisDataset = 'residentiel-logements/logements-epci-departement'

// Source : data/residentiel-logements/manifest.json : combustible des colonnes housing_m2_<type>_<combustible>_<période> pour chaque vecteur de consommation
const SURFACE_FUEL: Readonly<Record<ResidentialEnergyVector, string>> = {
  electricity: 'electricity',
  naturalGas: 'natural_gas',
  fuelOil: 'fuel_oil',
  liquefiedPetroleumGas: 'lpg',
  heat: 'heat_network',
}

// Source : documentation fonctionnelle PlanET (juin 2026), pp. 53-54 : rénovation à −35 % pour les maisons individuelles et les appartements d'avant 1971 ; les appartements d'après 1971 (BBC rénovation, 110 kWhEP/m²/an) ne sont pas calculés, choix de conception, non validé
const ELIGIBLE_CELLS: readonly SurfaceCell[] = [
  { type: 'house', period: 'before_1971' },
  { type: 'house', period: '1971_to_2005' },
  { type: 'house', period: 'after_2005' },
  { type: 'private_apartment', period: 'before_1971' },
  { type: 'social_apartment', period: 'before_1971' },
]

// Source : data/residentiel-logements/manifest.json : types de logement et périodes de construction des colonnes de surface
const NOT_ELIGIBLE_CELLS: readonly SurfaceCell[] = [
  { type: 'private_apartment', period: '1971_to_2005' },
  { type: 'private_apartment', period: 'after_2005' },
  { type: 'social_apartment', period: '1971_to_2005' },
  { type: 'social_apartment', period: 'after_2005' },
]

// Source : choix de conception, non validé : un territoire sans logement chauffé à ce combustible n'a aucune surface à rénover plutôt qu'une division par zéro
const NO_ELIGIBLE_SURFACE: Fraction = quantity<'Fraction'>('0')

function sumSurfaces({
  dataset,
  rows,
  fuel,
  cells,
}: {
  dataset: string
  rows: readonly DataRow[]
  fuel: string
  cells: readonly SurfaceCell[]
}): Result<SquareMetres, DataSourceError> {
  return Result.combine(
    rows.flatMap((row) =>
      cells.map(({ type, period }) =>
        requireQuantityColumn<'SquareMetres'>({
          dataset,
          row,
          column: `housing_m2_${type}_${fuel}_${period}`,
        }),
      ),
    ),
  ).map((surfaces) => quantity<'SquareMetres'>(sum(surfaces).toFixed()))
}

function toEligibleShare({
  dataset,
  rows,
  vector,
}: {
  dataset: string
  rows: readonly DataRow[]
  vector: ResidentialEnergyVector
}): Result<Fraction, DataSourceError> {
  const fuel = SURFACE_FUEL[vector]
  return Result.combine([
    sumSurfaces({ dataset, rows, fuel, cells: ELIGIBLE_CELLS }),
    sumSurfaces({ dataset, rows, fuel, cells: NOT_ELIGIBLE_CELLS }),
  ]).map(([eligible, notEligible]) => {
    const total = eligible.plus(notEligible)
    return total.isZero()
      ? NO_ELIGIBLE_SURFACE
      : quantity<'Fraction'>(eligible.dividedBy(total).toFixed())
  })
}

function toEligibleShares({
  dataset,
  rows,
}: {
  dataset: string
  rows: readonly DataRow[]
}): Result<Readonly<Record<ResidentialEnergyVector, Fraction>>, DataSourceError> {
  return Result.combine([
    toEligibleShare({ dataset, rows, vector: 'electricity' }),
    toEligibleShare({ dataset, rows, vector: 'naturalGas' }),
    toEligibleShare({ dataset, rows, vector: 'fuelOil' }),
    toEligibleShare({ dataset, rows, vector: 'liquefiedPetroleumGas' }),
    toEligibleShare({ dataset, rows, vector: 'heat' }),
  ]).map(([electricity, naturalGas, fuelOil, liquefiedPetroleumGas, heat]) => ({
    electricity,
    naturalGas,
    fuelOil,
    liquefiedPetroleumGas,
    heat,
  }))
}

function readDepartementRows({
  dataSource,
  departements,
}: {
  dataSource: DataSource
  departements: ReadonlySet<string>
}): Result<readonly DataRow[], DataSourceError> {
  return dataSource.rows(departementsDataset).andThen((rows) =>
    Result.combine(
      [...departements].map((departement) => {
        const found = rows.find((row) => row['code_departement'] === departement)
        return found === undefined
          ? err(missingData({ dataset: departementsDataset, key: departement }))
          : ok(found)
      }),
    ),
  )
}

function readRegionDepartements({
  communes,
  getDepartementByCommune,
}: {
  communes: readonly string[]
  getDepartementByCommune: DepartementLookup
}): Result<ReadonlySet<string>, DataSourceError> {
  return Result.combine(communes.map(getDepartementByCommune)).map(
    (departements) =>
      new Set(departements.filter((departement): departement is string => departement !== undefined)),
  )
}

function readEpciRows({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<'epci'>
}): Result<readonly DataRow[], DataSourceError> {
  return dataSource
    .rows(epcisDataset)
    .map((rows) => rows.filter((row) => row['code_epci'] === territory.code))
}

function readEligibleSurfaceShares({
  dataSource,
  territory,
  communes,
  getDepartementByCommune,
}: {
  dataSource: DataSource
  territory: Territory<Level>
  communes: readonly string[]
  getDepartementByCommune: DepartementLookup
}): Result<Readonly<Record<ResidentialEnergyVector, Fraction>>, DataSourceError> {
  return match(territory)
    .with({ level: 'epci' }, (epci) =>
      readEpciRows({ dataSource, territory: epci }).andThen((rows) =>
        toEligibleShares({ dataset: epcisDataset, rows }),
      ),
    )
    .with({ level: 'departement' }, ({ code }) =>
      readDepartementRows({ dataSource, departements: new Set([code]) }).andThen((rows) =>
        toEligibleShares({ dataset: departementsDataset, rows }),
      ),
    )
    .with({ level: 'region' }, () =>
      readRegionDepartements({ communes, getDepartementByCommune })
        .andThen((departements) => readDepartementRows({ dataSource, departements }))
        .andThen((rows) => toEligibleShares({ dataset: departementsDataset, rows })),
    )
    .exhaustive()
}

export { readEligibleSurfaceShares }
