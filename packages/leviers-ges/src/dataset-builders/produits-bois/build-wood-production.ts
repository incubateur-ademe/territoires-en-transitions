import { sortBy } from 'es-toolkit'
import { Result, err, ok } from 'neverthrow'
import { sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { toCsvText } from '../to-csv-text.ts'
import {
  harvestDataset,
  NATIONAL_GEOGRAPHY,
  readHarvestProductions,
  type LocatedProduction,
  type Production,
} from './read-harvest-productions.ts'
import { readProductsCarbon, type ProductsCarbon } from './read-products-carbon.ts'

type CodedProduction = { readonly code: string; readonly production: Production }

type WoodBuild = {
  readonly regionsCsv: string
  readonly departementsCsv: string
  readonly constantsCsv: string
  readonly regionCount: number
  readonly departementCount: number
  readonly regionTotals: Production
  readonly departementTotals: Production
}

const outputDataset = 'produits-bois'

// Source : data/produits-bois/manifest.json, colonnes de regions.csv
const REGIONS_COLUMNS = ['code_region', 'logs_thousand_m3', 'industrial_wood_thousand_m3'] as const

// Source : data/produits-bois/manifest.json, colonnes de departements.csv
const DEPARTEMENTS_COLUMNS = [
  'code_departement',
  'logs_thousand_m3',
  'industrial_wood_thousand_m3',
] as const

// Source : data/produits-bois/manifest.json, colonnes de constants.csv
const CONSTANTS_COLUMNS = ['name', 'value'] as const

// Source : data/produits-bois/manifest.json, clés de constants.csv lues par le levier produits_bois
const CONSTANT_NAMES = {
  nationalLogs: 'national_logs_thousand_m3',
  nationalIndustrialWood: 'national_industrial_wood_thousand_m3',
  timberProductsCarbon: 'timber_products_carbon_tc',
  industrialProductsCarbon: 'industrial_products_carbon_tc',
} as const

function sumProductions(productions: readonly Production[]): Production {
  const logsThousandM3 = sum(productions.map((production) => toBig(production.logsThousandM3)))
  const industrialWoodThousandM3 = sum(
    productions.map((production) => toBig(production.industrialWoodThousandM3)),
  )
  return {
    logsThousandM3: logsThousandM3.toFixed(),
    industrialWoodThousandM3: industrialWoodThousandM3.toFixed(),
  }
}

function findNationalProduction(
  located: readonly LocatedProduction[],
): Result<Production, InvalidDataset> {
  const national = located.find(({ geography }) => geography.kind === 'national')
  return national === undefined
    ? err(
        invalidDataset({
          dataset: harvestDataset,
          reason: 'missing_key_column',
          detail: NATIONAL_GEOGRAPHY,
        }),
      )
    : ok(national.production)
}

function selectCodedProductions(
  located: readonly LocatedProduction[],
  kind: 'region' | 'departement',
): readonly CodedProduction[] {
  const codedProductions = located.flatMap(({ geography, production }) =>
    geography.kind === kind ? [{ code: geography.code, production }] : [],
  )
  return sortBy(codedProductions, [({ code }) => code])
}

function toProductionRows(
  codedProductions: readonly CodedProduction[],
): readonly (readonly string[])[] {
  return codedProductions.map(({ code, production }) => [
    code,
    production.logsThousandM3,
    production.industrialWoodThousandM3,
  ])
}

function toConstantRows({
  national,
  carbon,
}: {
  national: Production
  carbon: ProductsCarbon
}): readonly (readonly string[])[] {
  return [
    [CONSTANT_NAMES.nationalLogs, national.logsThousandM3],
    [CONSTANT_NAMES.nationalIndustrialWood, national.industrialWoodThousandM3],
    [CONSTANT_NAMES.timberProductsCarbon, carbon.timberProductsCarbonTc],
    [CONSTANT_NAMES.industrialProductsCarbon, carbon.industrialProductsCarbonTc],
  ]
}

function toWoodBuild({
  located,
  national,
  carbon,
}: {
  located: readonly LocatedProduction[]
  national: Production
  carbon: ProductsCarbon
}): Result<WoodBuild, InvalidDataset> {
  const dataset = outputDataset
  const regions = selectCodedProductions(located, 'region')
  const departements = selectCodedProductions(located, 'departement')
  const regionRows = toProductionRows(regions)
  const departementRows = toProductionRows(departements)
  const constantRows = toConstantRows({ national, carbon })
  return Result.combine([
    toCsvText({ dataset, columns: REGIONS_COLUMNS, rows: regionRows }),
    toCsvText({ dataset, columns: DEPARTEMENTS_COLUMNS, rows: departementRows }),
    toCsvText({ dataset, columns: CONSTANTS_COLUMNS, rows: constantRows }),
  ]).map(([regionsCsv, departementsCsv, constantsCsv]) => ({
    regionsCsv,
    departementsCsv,
    constantsCsv,
    regionCount: regions.length,
    departementCount: departements.length,
    regionTotals: sumProductions(regions.map(({ production }) => production)),
    departementTotals: sumProductions(departements.map(({ production }) => production)),
  }))
}

function buildWoodProduction({
  harvestCsv,
  productsCarbonCsv,
}: {
  harvestCsv: string
  productsCarbonCsv: string
}): Result<WoodBuild, InvalidDataset> {
  return readHarvestProductions(harvestCsv).andThen((located) =>
    Result.combine([findNationalProduction(located), readProductsCarbon(productsCarbonCsv)]).andThen(
      ([national, carbon]) => toWoodBuild({ located, national, carbon }),
    ),
  )
}

export { buildWoodProduction }
export type { WoodBuild }
