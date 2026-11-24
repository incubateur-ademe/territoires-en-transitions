import { sortBy } from 'es-toolkit'
import { Result, err } from 'neverthrow'
import { requireColumn, requireNonEmptyColumn } from '../../application/require-column.ts'
import { parseBig, sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'

type ZoneDeliveries = {
  readonly csv: string
  readonly count: number
  readonly previousCampaignTonnes: string
  readonly latestCampaignTonnes: string
}

type NitrogenDeliveries = {
  readonly regions: ZoneDeliveries
  readonly departements: ZoneDeliveries
}

type Delivery = {
  readonly zone: string
  readonly code: string
  readonly previousCampaignTonnes: string
  readonly latestCampaignTonnes: string
}

const dataset = 'fertilisation-azotee/sources/unifa-azote-2023-2024.csv'

// Source : data/fertilisation-azotee/manifest.json, colonnes de regions.csv
const REGION_COLUMNS = [
  'code_region',
  'nitrogen_delivered_tonnes_2022_2023',
  'nitrogen_delivered_tonnes_2023_2024',
] as const

// Source : data/fertilisation-azotee/manifest.json, colonnes de departements.csv
const DEPARTEMENT_COLUMNS = [
  'code_departement',
  'nitrogen_delivered_tonnes_2022_2023',
  'nitrogen_delivered_tonnes_2023_2024',
] as const

// Source : UNIFA, livraisons 2023-2024 par département : la Corse est publiée sous le code 20 sans distinguer 2A et 2B, et la page « Région parisienne » (99) regroupe des départements déjà comptés (choix de conception, non validé)
const UNSPLITTABLE_DEPARTEMENT_CODES: ReadonlySet<string> = new Set(['20', '99'])

// Source : Insee, code officiel géographique : un code de département métropolitain numérique compte 2 chiffres, complété à gauche par un zéro
const DEPARTEMENT_CODE_PADDING = '0'

// Source : Insee, code officiel géographique : un code de département métropolitain numérique compte 2 chiffres
const DEPARTEMENT_CODE_LENGTH = 2

// Source : UNIFA, livraisons 2023-2024 : l'évolution est publiée en pour cent de la campagne 2022-2023 révisée
const PERCENT = toBig('100')

// Source : UNIFA, livraisons 2023-2024 : campagne précédente = azote 2023-2024 ÷ (1 + évolution ÷ 100)
const UNIT_GROWTH_FACTOR = toBig('1')

function toRevisedPreviousCampaign({
  latest,
  evolutionPercent,
}: {
  latest: string
  evolutionPercent: string
}): Result<string, InvalidDataset> {
  return Result.combine([
    parseBig(latest),
    parseBig(evolutionPercent),
  ])
    .mapErr(() => invalidDataset({ dataset, reason: 'unreadable', detail: `${latest} / ${evolutionPercent}` }))
    .andThen(([latestTonnes, percent]) => {
      const relativeChange = percent.dividedBy(PERCENT)
      const growth = UNIT_GROWTH_FACTOR.plus(relativeChange)
      return growth.isLessThanOrEqualTo(0)
        ? err(invalidDataset({ dataset, reason: 'unreadable', detail: `evolution ${evolutionPercent} % cancels or reverses the previous campaign` }))
        : roundToLoaderPrecision({
            dataset,
            column: 'azote_2022_2023_t',
            text: latestTonnes.dividedBy(growth).toFixed(),
          })
    })
}

function toDelivery(row: DataRow): Result<Delivery, InvalidDataset> {
  return Result.combine([
    requireColumn({ dataset, row, column: 'zone' }),
    requireNonEmptyColumn({ dataset, row, column: 'code' }),
    requireColumn({ dataset, row, column: 'azote_2023_2024_t' }).andThen((text) =>
      roundToLoaderPrecision({ dataset, column: 'azote_2023_2024_t', text }),
    ),
    requireColumn({ dataset, row, column: 'evolution_azote_vs_2022_2023_pct' }),
  ]).andThen(([zone, code, latestCampaignTonnes, evolutionPercent]) =>
    toRevisedPreviousCampaign({ latest: latestCampaignTonnes, evolutionPercent }).map(
      (previousCampaignTonnes) => ({ zone, code, previousCampaignTonnes, latestCampaignTonnes }),
    ),
  )
}

function toZoneDeliveries({
  deliveries,
  columns,
}: {
  deliveries: readonly Delivery[]
  columns: readonly string[]
}): Result<ZoneDeliveries, InvalidDataset> {
  const sorted = sortBy(deliveries, [({ code }) => code])
  return toCsvText({
    dataset,
    columns,
    rows: sorted.map(({ code, previousCampaignTonnes, latestCampaignTonnes }) => [
      code,
      previousCampaignTonnes,
      latestCampaignTonnes,
    ]),
  }).map((csv) => ({
    csv,
    count: sorted.length,
    previousCampaignTonnes: sum(sorted.map((delivery) => toBig(delivery.previousCampaignTonnes))).toFixed(),
    latestCampaignTonnes: sum(sorted.map((delivery) => toBig(delivery.latestCampaignTonnes))).toFixed(),
  }))
}

function buildNitrogenDeliveries({
  deliveriesCsv,
}: {
  deliveriesCsv: string
}): Result<NitrogenDeliveries, InvalidDataset> {
  return parseCsvText({ text: deliveriesCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) => Result.combine(rows.map(toDelivery)))
    .andThen((deliveries) => {
      const regionDeliveries = deliveries.filter(({ zone }) => zone === 'region')
      const departementDeliveries = deliveries
        .filter(({ zone }) => zone === 'departement')
        .map((delivery) => ({
          ...delivery,
          code: delivery.code.padStart(DEPARTEMENT_CODE_LENGTH, DEPARTEMENT_CODE_PADDING),
        }))
        .filter(({ code }) => !UNSPLITTABLE_DEPARTEMENT_CODES.has(code))
      return Result.combine([
        toZoneDeliveries({ deliveries: regionDeliveries, columns: REGION_COLUMNS }),
        toZoneDeliveries({ deliveries: departementDeliveries, columns: DEPARTEMENT_COLUMNS }),
      ])
    })
    .map(([regions, departements]) => ({ regions, departements }))
}

export { buildNitrogenDeliveries }
export type { NitrogenDeliveries, ZoneDeliveries }
