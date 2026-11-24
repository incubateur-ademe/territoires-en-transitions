import { groupBy, sortBy } from 'es-toolkit'
import type BigNumber from 'bignumber.js'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBig, sum } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { toCsvText } from '../to-csv-text.ts'
import {
  listSecretCategories,
  NO_HEADS,
  SECRET_STATISTIC_MARK,
  toLivestockHeadcount,
  type LivestockCategories,
  type LivestockHeadcount,
} from './livestock-headcount.ts'

type Level = 'region' | 'departement'

type LivestockHeadcountsLevel = {
  readonly csv: string
  readonly territoryCount: number
  readonly secretCellCount: number
  readonly totals: Readonly<Record<string, string>>
}

type LivestockHeadcounts = {
  readonly regions: LivestockHeadcountsLevel
  readonly departements: LivestockHeadcountsLevel
}

type TerritoryHeadcount = {
  readonly code: string
  readonly headcount: LivestockHeadcount
  readonly secretCells: readonly string[]
}

const agresteDataset = 'elevage-durable/sources/agreste-ra2020-cheptels-departement-region.csv'
const regionsOutputDataset = 'elevage-durable/regions.csv'
const departementsOutputDataset = 'elevage-durable/departements.csv'
const cartostatDataset =
  'elevage-durable/sources/cartostat-vaches-laitieres-2020-departements-regions.csv'

// Source : colonnes de regions.csv et departements.csv déclarées dans data/elevage-durable/manifest.json
const HEADCOUNT_COLUMNS = [
  ['dairy_cows', (headcount: LivestockHeadcount) => headcount.dairyCows],
  ['other_cattle', (headcount: LivestockHeadcount) => headcount.otherCattle],
  ['sows', (headcount: LivestockHeadcount) => headcount.sows],
  ['other_pigs', (headcount: LivestockHeadcount) => headcount.otherPigs],
  ['goats', (headcount: LivestockHeadcount) => headcount.goats],
  ['sheep', (headcount: LivestockHeadcount) => headcount.sheep],
  ['horses', (headcount: LivestockHeadcount) => headcount.horses],
  ['mules_and_donkeys', (headcount: LivestockHeadcount) => headcount.mulesAndDonkeys],
  ['laying_hens', (headcount: LivestockHeadcount) => headcount.layingHens],
  ['broilers', (headcount: LivestockHeadcount) => headcount.broilers],
  ['other_poultry', (headcount: LivestockHeadcount) => headcount.otherPoultry],
] as const

// Source : Insee, code officiel géographique : les 13 régions de France métropolitaine ; l'outre-mer est hors du champ des données d'élevage de ce dépôt (choix de conception, non validé)
const METROPOLITAN_REGION_CODES: ReadonlySet<string> = new Set([
  '11', '24', '27', '28', '32', '44', '52', '53', '75', '76', '84', '93', '94',
])

// Source : Insee, code officiel géographique : un code de département métropolitain compte deux chiffres, ou 2A et 2B pour la Corse
const METROPOLITAN_DEPARTEMENT_CODE = /^(\d{2}|2A|2B)$/

// Source : cartostat, vaches laitières 2020 : la valeur « secret » marque le secret statistique
const DAIRY_COWS_SECRET_MARK = 'secret'

// Source : choix de conception, non validé : repère de la cellule des vaches laitières dans la liste des cellules sous secret
const DAIRY_COWS_CELL = 'dairy_cows'

// Source : Agreste, recensement agricole 2020, cheptels : le code d'une région est préfixé par NR
const REGION_GEOGRAPHY_PREFIX = 'NR'

function toTerritoryCode({ geography, level }: { geography: string; level: Level }): string | undefined {
  if (level === 'region') {
    if (!geography.startsWith(REGION_GEOGRAPHY_PREFIX)) return undefined
    const code = geography.slice(REGION_GEOGRAPHY_PREFIX.length)
    return METROPOLITAN_REGION_CODES.has(code) ? code : undefined
  }
  return METROPOLITAN_DEPARTEMENT_CODE.test(geography) ? geography : undefined
}

function validateHeadcountCell({
  dataset,
  cell,
}: {
  dataset: string
  cell: readonly [string, string, string]
}): Result<readonly [string, string, string], InvalidDataset> {
  const [, category, value] = cell
  if (value === SECRET_STATISTIC_MARK || parseBig(value).isOk()) return ok(cell)
  return err(
    invalidDataset({
      dataset,
      reason: 'unreadable',
      detail: `valeur=${value} (catégorie ${category}) is neither a decimal number nor the secret mark`,
    }),
  )
}

function readCategories({
  agresteCsv,
  level,
}: {
  agresteCsv: string
  level: Level
}): Result<ReadonlyMap<string, LivestockCategories>, InvalidDataset> {
  const dataset = agresteDataset
  return parseCsvText({ text: agresteCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row: DataRow) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'geographie' }),
            requireColumn({ dataset, row, column: 'code_categorie' }),
            requireColumn({ dataset, row, column: 'valeur' }),
          ]),
        ),
      ),
    )
    .andThen((cells) =>
      Result.combine(cells.map((cell) => validateHeadcountCell({ dataset, cell }))),
    )
    .map((cells) =>
      cells.flatMap(([geography, category, value]) => {
        const code = toTerritoryCode({ geography, level })
        return code === undefined ? [] : [{ code, category, value }]
      }),
    )
    .map(
      (cells) =>
        new Map(
          Object.entries(groupBy(cells, ({ code }) => code)).map(([code, territoryCells]) => [
            code,
            new Map(territoryCells.map(({ category, value }) => [category, value])),
          ]),
        ),
    )
}

function toDairyCows({
  dataset,
  code,
  text,
}: {
  dataset: string
  code: string
  text: string
}): Result<readonly [string, BigNumber | undefined], InvalidDataset> {
  if (text === DAIRY_COWS_SECRET_MARK) return ok([code, undefined])
  return parseBig(text)
    .map((dairyCows): readonly [string, BigNumber | undefined] => [code, dairyCows])
    .mapErr(() =>
      invalidDataset({
        dataset,
        reason: 'unreadable',
        detail: `vaches_laitieres_2020=${text} is neither a decimal number nor the secret mark`,
      }),
    )
}

function readDairyCows({
  cartostatCsv,
  level,
}: {
  cartostatCsv: string
  level: Level
}): Result<ReadonlyMap<string, BigNumber | undefined>, InvalidDataset> {
  const dataset = cartostatDataset
  return parseCsvText({ text: cartostatCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows
          .filter((row) => row['maille'] === level)
          .map((row) =>
            Result.combine([
              requireColumn({ dataset, row, column: 'code' }),
              requireColumn({ dataset, row, column: 'vaches_laitieres_2020' }),
            ]).andThen(([code, text]) => toDairyCows({ dataset, code, text })),
          ),
      ),
    )
    .map((entries) => new Map(entries))
}

function toTerritoryHeadcount({
  code,
  categories,
  dairyCowsOrSecret,
}: {
  code: string
  categories: LivestockCategories
  dairyCowsOrSecret: BigNumber | undefined
}): TerritoryHeadcount {
  const secretDairyCows = dairyCowsOrSecret === undefined ? [DAIRY_COWS_CELL] : []
  return {
    code,
    headcount: toLivestockHeadcount({ categories, dairyCows: dairyCowsOrSecret ?? NO_HEADS }),
    secretCells: [...listSecretCategories(categories), ...secretDairyCows],
  }
}

function toLevel({
  territories,
  dataset,
  keyColumn,
}: {
  territories: readonly TerritoryHeadcount[]
  dataset: string
  keyColumn: string
}): Result<LivestockHeadcountsLevel, InvalidDataset> {
  const territoriesSortedByCode = sortBy(territories, [({ code }) => code])
  return toCsvText({
    dataset,
    columns: [keyColumn, ...HEADCOUNT_COLUMNS.map(([column]) => column)],
    rows: territoriesSortedByCode.map(({ code, headcount }) => [
      code,
      ...HEADCOUNT_COLUMNS.map(([, select]) => select(headcount).toFixed()),
    ]),
  }).map((csv) => ({
    csv,
    territoryCount: territoriesSortedByCode.length,
    secretCellCount: territoriesSortedByCode.flatMap(({ secretCells }) => secretCells).length,
    totals: Object.fromEntries(
      HEADCOUNT_COLUMNS.map(([column, select]) => [
        column,
        sum(territoriesSortedByCode.map(({ headcount }) => select(headcount))).toFixed(),
      ]),
    ),
  }))
}

function buildLevel({
  agresteCsv,
  cartostatCsv,
  level,
}: {
  agresteCsv: string
  cartostatCsv: string
  level: Level
}): Result<LivestockHeadcountsLevel, InvalidDataset> {
  const keyColumn = level === 'region' ? 'code_region' : 'code_departement'
  const outputDataset = level === 'region' ? regionsOutputDataset : departementsOutputDataset
  return Result.combine([
    readCategories({ agresteCsv, level }),
    readDairyCows({ cartostatCsv, level }),
  ]).andThen(([categoriesByCode, dairyCowsByCode]) =>
    toLevel({
      territories: [...categoriesByCode].map(([code, categories]) =>
        toTerritoryHeadcount({ code, categories, dairyCowsOrSecret: dairyCowsByCode.get(code) }),
      ),
      dataset: outputDataset,
      keyColumn,
    }),
  )
}

function buildLivestockHeadcounts({
  agresteCsv,
  cartostatCsv,
}: {
  agresteCsv: string
  cartostatCsv: string
}): Result<LivestockHeadcounts, InvalidDataset> {
  return Result.combine([
    buildLevel({ agresteCsv, cartostatCsv, level: 'region' }),
    buildLevel({ agresteCsv, cartostatCsv, level: 'departement' }),
  ]).map(([regions, departements]) => ({ regions, departements }))
}

export { buildLivestockHeadcounts }
export type { LivestockHeadcounts }
