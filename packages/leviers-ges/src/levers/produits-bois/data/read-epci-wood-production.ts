import { Result, err, ok } from 'neverthrow'
import {
  requireNonEmptyColumn,
  requireQuantityColumn,
} from '../../../application/require-column.ts'
import {
  invalidDataset,
  missingData,
  type DataRow,
  type DataSource,
  type DataSourceError,
} from '../../../domain/data-source.ts'
import type { Territory } from '../../../domain/territory.ts'
import type { Hectares } from '../../../domain/units.ts'
import {
  apportionWoodProduction,
  type DepartementContribution,
} from './apportion-wood-production.ts'
import { toWoodProduction } from './to-wood-production.ts'
import type { WoodProduction } from './wood-production.ts'

const epciForestDataset = 'produits-bois/foret-epci-departement'

const departementForestDataset = 'produits-bois/foret-departement'

const departementsDataset = 'produits-bois/departements'

type EpciForest = { readonly departement: string; readonly hectares: Hectares }

function toEpciForest(row: DataRow): Result<EpciForest, DataSourceError> {
  const dataset = epciForestDataset
  return Result.combine([
    requireNonEmptyColumn({ dataset, row, column: 'code_departement' }),
    requireQuantityColumn<'Hectares'>({
      dataset,
      row,
      column: 'forest_hectares',
    }),
  ]).map(([departement, hectares]) => ({ departement, hectares }))
}

function readEpciForests({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<'epci'>
}): Result<readonly EpciForest[], DataSourceError> {
  return dataSource.rows(epciForestDataset).andThen((rows) => {
    const epciRows = rows.filter((row) => row['code_epci'] === territory.code)
    return epciRows.length === 0
      ? err(missingData({ dataset: epciForestDataset, key: territory.code }))
      : Result.combine(epciRows.map(toEpciForest))
  })
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
  epciForest,
  forestRows,
  productionRows,
}: {
  epciForest: EpciForest
  forestRows: readonly DataRow[]
  productionRows: readonly DataRow[]
}): Result<DepartementContribution, DataSourceError> {
  const { departement, hectares } = epciForest
  return Result.combine([
    findDepartementRow({
      dataset: departementForestDataset,
      rows: forestRows,
      departement,
    }).andThen((row) =>
      requireQuantityColumn<'Hectares'>({
        dataset: departementForestDataset,
        row,
        column: 'forest_hectares',
      }),
    ),
    findDepartementRow({
      dataset: departementsDataset,
      rows: productionRows,
      departement,
    }).andThen((row) => toWoodProduction({ dataset: departementsDataset, row })),
  ]).andThen(([departementForest, departementProduction]) =>
    hectares.isGreaterThan(departementForest)
      ? err(
          invalidDataset({
            dataset: epciForestDataset,
            reason: 'control_total_mismatch',
            detail: `${departement}: forest_hectares=${hectares.toFixed()} exceeds the department's ${departementForest.toFixed()}`,
          }),
        )
      : ok({ epciForest: hectares, departementForest, departementProduction }),
  )
}

function readEpciWoodProduction({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<'epci'>
}): Result<WoodProduction, DataSourceError> {
  return Result.combine([
    readEpciForests({ dataSource, territory }),
    dataSource.rows(departementForestDataset),
    dataSource.rows(departementsDataset),
  ])
    .andThen(([epciForests, forestRows, productionRows]) =>
      Result.combine(
        epciForests.map((epciForest) => toContribution({ epciForest, forestRows, productionRows })),
      ),
    )
    .map(apportionWoodProduction)
}

export { readEpciWoodProduction }
