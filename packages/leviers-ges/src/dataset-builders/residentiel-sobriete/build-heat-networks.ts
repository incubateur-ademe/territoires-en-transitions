import { Result } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { readSdesHeatNetworks, type SdesHeatNetwork } from '../read-sdes-heat-networks.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'

type HeatNetworkRow = {
  readonly networkId: string
  readonly communeCode: string
  readonly residentialDeliveredMwh: string
  readonly emissionFactor: string
}

type HeatNetworksBuild = {
  readonly csv: string
  readonly networkCount: number
  readonly secretNetworkCount: number
  readonly totalResidentialDeliveredMwh: string
}

const heatDataset = 'residentiel-sobriete/sources/sdes-chaleur-commune-2024.csv'

// Source : data/residentiel-sobriete/manifest.json, colonnes de heat-networks.csv
const HEAT_NETWORKS_COLUMNS = [
  'network_id',
  'commune_code',
  'delivered_mwh',
  'emission_factor_kg_per_kwh',
] as const

function toHeatNetworkRow({
  networkId,
  communeCode,
  deliveredMwh,
  row,
}: SdesHeatNetwork): Result<HeatNetworkRow, InvalidDataset> {
  const dataset = heatDataset
  return requireColumn({ dataset, row, column: 'CONTENU_EN_CO2' })
    .andThen((carbonContent) =>
      roundToLoaderPrecision({ dataset, column: 'CONTENU_EN_CO2', text: carbonContent }),
    )
    .map((emissionFactor) => ({
      networkId,
      communeCode,
      residentialDeliveredMwh: deliveredMwh,
      emissionFactor,
    }))
}

function toCsv(networks: readonly HeatNetworkRow[]): Result<string, InvalidDataset> {
  return toCsvText({
    dataset: heatDataset,
    columns: HEAT_NETWORKS_COLUMNS,
    rows: networks.map(({ networkId, communeCode, residentialDeliveredMwh, emissionFactor }) => [
      networkId,
      communeCode,
      residentialDeliveredMwh,
      emissionFactor,
    ]),
  })
}

function buildHeatNetworks(heatCsv: string): Result<HeatNetworksBuild, InvalidDataset> {
  return readSdesHeatNetworks({
    csv: heatCsv,
    dataset: heatDataset,
    consumptionColumn: 'CONSOR',
  }).andThen(({ networks, secretNetworkCount }) =>
    Result.combine(networks.map(toHeatNetworkRow)).andThen((rows) => {
      const totalResidentialDeliveredMwh = sum(
        rows.map(({ residentialDeliveredMwh }) => toBig(residentialDeliveredMwh)),
      )
      return toCsv(rows).map((csv) => ({
        csv,
        networkCount: rows.length,
        secretNetworkCount,
        totalResidentialDeliveredMwh: totalResidentialDeliveredMwh.toFixed(),
      }))
    }),
  )
}

export { buildHeatNetworks }
