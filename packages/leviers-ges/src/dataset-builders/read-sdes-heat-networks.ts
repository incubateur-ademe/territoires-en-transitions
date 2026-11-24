import { sortBy } from 'es-toolkit'
import { Result, ok } from 'neverthrow'
import { requireColumn } from '../application/require-column.ts'
import type { DataRow, InvalidDataset } from '../domain/data-source.ts'
import { parseCsvText } from '../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from './round-to-loader-precision.ts'
import { SECRET_MARKER } from './secret-statistic.ts'
import { toCityCode } from './to-city-code.ts'

type ConsumptionColumn = 'CONSOR' | 'CONSOTOT'

type SdesHeatNetwork = {
  readonly networkId: string
  readonly communeCode: string
  readonly deliveredMwh: string
  readonly row: DataRow
}

type SdesHeatNetworksRead = {
  readonly networks: readonly SdesHeatNetwork[]
  readonly secretNetworkCount: number
}

type SdesHeatNetworkRecord =
  | { readonly kind: 'secret' }
  | { readonly kind: 'network'; readonly network: SdesHeatNetwork }

function toRecord({
  dataset,
  consumptionColumn,
  networkId,
  row,
}: {
  dataset: string
  consumptionColumn: ConsumptionColumn
  networkId: string
  row: DataRow
}): Result<SdesHeatNetworkRecord, InvalidDataset> {
  return Result.combine([
    requireColumn({ dataset, row, column: 'COMMUNE_CODE' }),
    requireColumn({ dataset, row, column: consumptionColumn }),
  ]).andThen(([communeCode, consumption]): Result<SdesHeatNetworkRecord, InvalidDataset> => {
    if (consumption === SECRET_MARKER) return ok({ kind: 'secret' })
    return roundToLoaderPrecision({ dataset, column: consumptionColumn, text: consumption }).map(
      (deliveredMwh) => ({
        kind: 'network',
        network: { networkId, communeCode: toCityCode(communeCode), deliveredMwh, row },
      }),
    )
  })
}

function readSdesHeatNetworks({
  csv,
  dataset,
  consumptionColumn,
}: {
  csv: string
  dataset: string
  consumptionColumn: ConsumptionColumn
}): Result<SdesHeatNetworksRead, InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ';' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          requireColumn({ dataset, row, column: 'ID' }).map((networkId) => ({ networkId, row })),
        ),
      ),
    )
    .map((identified) => sortBy(identified, [({ networkId }) => networkId]))
    .andThen((sorted) =>
      Result.combine(
        sorted.map(({ networkId, row }) =>
          toRecord({ dataset, consumptionColumn, networkId, row }),
        ),
      ),
    )
    .map((records) => ({
      networks: records.flatMap((record) => (record.kind === 'network' ? [record.network] : [])),
      secretNetworkCount: records.filter(({ kind }) => kind === 'secret').length,
    }))
}

export { readSdesHeatNetworks }
export type { SdesHeatNetwork, SdesHeatNetworksRead }
