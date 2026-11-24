import { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { DataRow, InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { readSdesHeatNetworks, type SdesHeatNetwork } from '../read-sdes-heat-networks.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'

type FactorSource = 'fcu' | 'sdes'

type Network = {
  readonly networkId: string
  readonly communeCode: string
  readonly deliveredMwh: string
  readonly emissionFactor: string
  readonly factorSource: FactorSource
}

type NetworksBuild = {
  readonly csv: string
  readonly networkCount: number
  readonly secretNetworkCount: number
  readonly totalDeliveredMwh: string
}

const sdesDataset = 'reseaux-chaleur/sources/sdes-chaleur-commune-2024.csv'
const fcuDataset = 'reseaux-chaleur/sources/fcu-reseaux-chaleur.csv'

// Source : data/reseaux-chaleur/manifest.json, colonnes de networks.csv
const NETWORKS_COLUMNS = [
  'network_id',
  'commune_code',
  'delivered_mwh',
  'emission_factor_kg_per_kwh',
  'emission_factor_source',
] as const

function readFcuFactors(fcuCsv: string): Result<ReadonlyMap<string, string>, InvalidDataset> {
  const dataset = fcuDataset
  return parseCsvText({ text: fcuCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'identifiant_reseau' }),
            requireColumn({ dataset, row, column: 'contenu_co2_kgco2_kwh' }),
          ]),
        ),
      ),
    )
    .map((pairs) => new Map(pairs.filter(([networkId]) => networkId !== '')))
}

function resolveEmissionFactor({
  row,
  networkId,
  fcuFactors,
}: {
  row: DataRow
  networkId: string
  fcuFactors: ReadonlyMap<string, string>
}): Result<{ emissionFactor: string; factorSource: FactorSource }, InvalidDataset> {
  const fcuFactor = fcuFactors.get(networkId)
  if (fcuFactor !== undefined && fcuFactor !== '') {
    return roundToLoaderPrecision({
      dataset: fcuDataset,
      column: 'contenu_co2_kgco2_kwh',
      text: fcuFactor,
    }).map((emissionFactor) => ({ emissionFactor, factorSource: 'fcu' }))
  }
  return requireColumn({ dataset: sdesDataset, row, column: 'CONTENU_EN_CO2' })
    .andThen((text) =>
      roundToLoaderPrecision({ dataset: sdesDataset, column: 'CONTENU_EN_CO2', text }),
    )
    .map((emissionFactor) => ({ emissionFactor, factorSource: 'sdes' }))
}

function toNetwork({
  network,
  fcuFactors,
}: {
  network: SdesHeatNetwork
  fcuFactors: ReadonlyMap<string, string>
}): Result<Network, InvalidDataset> {
  const { networkId, communeCode, deliveredMwh, row } = network
  return resolveEmissionFactor({ row, networkId, fcuFactors }).map(
    ({ emissionFactor, factorSource }) => ({
      networkId,
      communeCode,
      deliveredMwh,
      emissionFactor,
      factorSource,
    }),
  )
}

function toCsv(networks: readonly Network[]): Result<string, InvalidDataset> {
  return toCsvText({
    dataset: sdesDataset,
    columns: NETWORKS_COLUMNS,
    rows: networks.map(({ networkId, communeCode, deliveredMwh, emissionFactor, factorSource }) => [
      networkId,
      communeCode,
      deliveredMwh,
      emissionFactor,
      factorSource,
    ]),
  })
}

function buildNetworks({
  sdesCsv,
  fcuCsv,
}: {
  sdesCsv: string
  fcuCsv: string
}): Result<NetworksBuild, InvalidDataset> {
  return Result.combine([
    readFcuFactors(fcuCsv),
    readSdesHeatNetworks({ csv: sdesCsv, dataset: sdesDataset, consumptionColumn: 'CONSOTOT' }),
  ]).andThen(([fcuFactors, { networks, secretNetworkCount }]) =>
    Result.combine(networks.map((network) => toNetwork({ network, fcuFactors }))).andThen(
      (resolved) => {
        const totalDeliveredMwh = sum(resolved.map(({ deliveredMwh }) => toBig(deliveredMwh)))
        return toCsv(resolved).map((csv) => ({
          csv,
          networkCount: resolved.length,
          secretNetworkCount,
          totalDeliveredMwh: totalDeliveredMwh.toFixed(),
        }))
      },
    ),
  )
}

export { buildNetworks }
export type { NetworksBuild }
