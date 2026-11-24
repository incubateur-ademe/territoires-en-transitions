import type BigNumber from 'bignumber.js'
import { groupBy, sortBy } from 'es-toolkit'
import { Result, err, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBig, sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type DataRow, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import { readEuroFactors } from './read-euro-factors.ts'

type FleetLine = {
  readonly regionCode: string
  readonly fuel: string
  readonly critAir: string
  readonly vehicles: BigNumber
}

type RegionTonneKilometres = {
  readonly regionCode: string
  readonly billionTonneKilometres: string
}

type RegionLine = {
  readonly regionCode: string
  readonly billionTonneKilometres: string
  readonly heavyVehicleFleet: BigNumber
  readonly zeroEmissionFleet: BigNumber
  readonly dieselEmissionFactor: string
  readonly dieselUnclassifiedShare: string
}

type GoodsTransportBuild = {
  readonly csv: string
  readonly regionCount: number
  readonly totals: Readonly<Record<string, string>>
}

const tonneKilometresDataset =
  'transport-marchandises/sources/sdes-trm-tkm-par-region-et-type-de-flux-2024.csv'
const fleetDataset = 'transport-marchandises/sources/sdes-parc-poids-lourds-2024-par-region.csv'
const regionsDataset = 'transport-marchandises/regions.csv'

// Source : data/transport-marchandises/manifest.json, colonnes de regions.csv
const REGION_COLUMNS = [
  'code_region',
  'billion_tonne_kilometres',
  'heavy_vehicle_fleet',
  'zero_emission_heavy_vehicle_fleet',
  'diesel_emission_factor_g_per_vehicle_km',
  'diesel_unclassified_share',
] as const

// Source : Insee, code officiel géographique : les 13 régions de France métropolitaine, nommées comme dans le fichier du SDES « Le TRM des pavillons européens en 2024 » (feuille reg_type_flux)
const REGION_CODE_BY_NAME: ReadonlyMap<string, string> = new Map([
  ['Auvergne-Rhône-Alpes', '84'],
  ['Bourgogne-Franche-Comté', '27'],
  ['Bretagne', '53'],
  ['Centre - Val de Loire', '24'],
  ['Corse', '94'],
  ['Grand Est', '44'],
  ['Hauts-de-France', '32'],
  ['Ile-de-France', '11'],
  ['Normandie', '28'],
  ['Nouvelle-Aquitaine', '75'],
  ['Occitanie', '76'],
  ['Pays de la Loire', '52'],
  ["Provence-Alpes-Côte d'Azur", '93'],
])

// Source : tableur PlanET V1, FE_transports!A15 : « Diesel, Diesel HNR et Diesel HR » sont regroupés
const DIESEL_FUELS: ReadonlySet<string> = new Set(['Diesel', 'Diesel HNR', 'Diesel HR'])

// Source : tableur PlanET V1, FE_transports!A19 : « électrique, hydrogène et autres ZE » prennent le facteur de l'électricité (choix de conception, non validé : la fiche d'analyse ne comptait que l'électrique, 899 poids lourds)
const ZERO_EMISSION_FUELS: ReadonlySet<string> = new Set(['Electrique', 'Hydrogène et autre ZE'])

function toRegionTonneKilometres(
  row: DataRow,
): Result<RegionTonneKilometres, InvalidDataset> {
  const dataset = tonneKilometresDataset
  return Result.combine([
    requireColumn({ dataset, row, column: 'region' }),
    requireColumn({ dataset, row, column: 'tkm_rapportees_avec_international' }).andThen((text) =>
      roundToLoaderPrecision({ dataset, column: 'tkm_rapportees_avec_international', text }),
    ),
  ]).andThen(([name, billionTonneKilometres]) => {
    const regionCode = REGION_CODE_BY_NAME.get(name)
    if (regionCode === undefined) {
      return err(invalidDataset({ dataset, reason: 'missing_key_column', detail: name }))
    }
    return ok({ regionCode, billionTonneKilometres })
  })
}

function readTonneKilometres(
  tonneKilometresCsv: string,
): Result<readonly RegionTonneKilometres[], InvalidDataset> {
  return parseCsvText({ text: tonneKilometresCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(tonneKilometresDataset))
    .andThen((rows) => Result.combine(rows.map(toRegionTonneKilometres)))
}

function toFleetLine(row: DataRow): Result<FleetLine, InvalidDataset> {
  const dataset = fleetDataset
  return Result.combine([
    requireColumn({ dataset, row, column: 'code_region' }),
    requireColumn({ dataset, row, column: 'carburant' }),
    requireColumn({ dataset, row, column: 'crit_air' }),
    requireColumn({ dataset, row, column: 'parc_poids_lourds_au_1er_janvier_2024' }).andThen((text) =>
      parseBig(text).mapErr(() =>
        invalidDataset({
          dataset,
          reason: 'unreadable',
          detail: `parc_poids_lourds_au_1er_janvier_2024=${text} is not a decimal number`,
        }),
      ),
    ),
  ]).map(([regionCode, fuel, critAir, vehicles]) => ({ regionCode, fuel, critAir, vehicles }))
}

function readFleet(fleetCsv: string): Result<readonly FleetLine[], InvalidDataset> {
  return parseCsvText({ text: fleetCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(fleetDataset))
    .andThen((rows) => Result.combine(rows.map(toFleetLine)))
}

function countVehicles(lines: readonly FleetLine[]): BigNumber {
  return sum(lines.map(({ vehicles }) => vehicles))
}

function toRegionLine({
  tonneKilometres,
  fleet,
  euroFactors,
}: {
  tonneKilometres: RegionTonneKilometres
  fleet: readonly FleetLine[]
  euroFactors: ReadonlyMap<string, BigNumber>
}): Result<RegionLine, InvalidDataset> {
  const { regionCode, billionTonneKilometres } = tonneKilometres
  const dieselFleet = fleet.filter(({ fuel }) => DIESEL_FUELS.has(fuel))
  const classifiedFleet = dieselFleet.flatMap(({ critAir, vehicles }) => {
    const euroFactor = euroFactors.get(critAir)
    return euroFactor === undefined ? [] : [{ vehicles, euroFactor }]
  })
  const classifiedVehicles = sum(classifiedFleet.map(({ vehicles }) => vehicles))
  if (classifiedVehicles.isZero()) {
    return err(
      invalidDataset({ dataset: fleetDataset, reason: 'missing_key_column', detail: regionCode }),
    )
  }
  const weightedEmissionsByFleet = classifiedFleet.map(({ vehicles, euroFactor }) =>
    vehicles.times(euroFactor),
  )
  const weightedEmissions = sum(weightedEmissionsByFleet)
  const dieselVehicles = countVehicles(dieselFleet)
  const unclassifiedVehicles = dieselVehicles.minus(classifiedVehicles)
  const averageEmissionFactor = weightedEmissions.dividedBy(classifiedVehicles)
  const unclassifiedShare = unclassifiedVehicles.dividedBy(dieselVehicles)
  return Result.combine([
    roundToLoaderPrecision({
      dataset: regionsDataset,
      column: 'diesel_emission_factor_g_per_vehicle_km',
      text: averageEmissionFactor.toFixed(),
    }),
    roundToLoaderPrecision({
      dataset: regionsDataset,
      column: 'diesel_unclassified_share',
      text: unclassifiedShare.toFixed(),
    }),
  ]).map(([dieselEmissionFactor, dieselUnclassifiedShare]) => ({
    regionCode,
    billionTonneKilometres,
    heavyVehicleFleet: countVehicles(fleet),
    zeroEmissionFleet: countVehicles(fleet.filter(({ fuel }) => ZERO_EMISSION_FUELS.has(fuel))),
    dieselEmissionFactor,
    dieselUnclassifiedShare,
  }))
}

function toTotals(regionLines: readonly RegionLine[]): Readonly<Record<string, string>> {
  const billionTonneKilometres = regionLines.map((line) => toBig(line.billionTonneKilometres))
  const heavyVehicleFleets = regionLines.map((line) => line.heavyVehicleFleet)
  const zeroEmissionFleets = regionLines.map((line) => line.zeroEmissionFleet)
  return {
    billion_tonne_kilometres: sum(billionTonneKilometres).toFixed(),
    heavy_vehicle_fleet: sum(heavyVehicleFleets).toFixed(),
    zero_emission_heavy_vehicle_fleet: sum(zeroEmissionFleets).toFixed(),
  }
}

function buildGoodsTransport({
  tonneKilometresCsv,
  fleetCsv,
  omineaCsv,
}: {
  tonneKilometresCsv: string
  fleetCsv: string
  omineaCsv: string
}): Result<GoodsTransportBuild, InvalidDataset> {
  return Result.combine([
    readTonneKilometres(tonneKilometresCsv),
    readFleet(fleetCsv),
    readEuroFactors(omineaCsv),
  ])
    .andThen(([regionTonneKilometres, fleet, euroFactors]) => {
      const fleetByRegion = groupBy(fleet, ({ regionCode }) => regionCode)
      return Result.combine(
        regionTonneKilometres.map((tonneKilometres) =>
          toRegionLine({
            tonneKilometres,
            fleet: fleetByRegion[tonneKilometres.regionCode] ?? [],
            euroFactors,
          }),
        ),
      )
    })
    .map((regionLines) => sortBy(regionLines, [({ regionCode }) => regionCode]))
    .andThen((regionLines) =>
      toCsvText({
        dataset: regionsDataset,
        columns: REGION_COLUMNS,
        rows: regionLines.map((line) => [
          line.regionCode,
          line.billionTonneKilometres,
          line.heavyVehicleFleet.toFixed(),
          line.zeroEmissionFleet.toFixed(),
          line.dieselEmissionFactor,
          line.dieselUnclassifiedShare,
        ]),
      }).map((csv) => ({
        csv,
        regionCount: regionLines.length,
        totals: toTotals(regionLines),
      })),
    )
}

export { buildGoodsTransport }
