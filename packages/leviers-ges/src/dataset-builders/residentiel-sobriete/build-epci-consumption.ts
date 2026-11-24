import type BigNumber from 'bignumber.js'
import { Result, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { parseBigWithExponent, sum, toBig } from '../../domain/big-number.ts'
import { invalidDataset, type InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'

type EpciConsumptionSources = {
  readonly epciElectricityCsv: string
  readonly epciGasCsv: string
}

type EpciConsumption = {
  readonly csv: string
  readonly epciCount: number
  readonly electricityMwh: string
  readonly naturalGasMwh: string
  readonly secretElectricityLineCount: number
  readonly secretGasLineCount: number
}

type EpciLine = { readonly epci: string; readonly mwh: BigNumber | undefined }

const electricityDataset =
  'residentiel-sobriete/sources/sdes-electricite-epci-2024-residentiel.csv'

const gasDataset = 'residentiel-sobriete/sources/sdes-gaz-epci-2024-residentiel.csv'

const outputDataset = 'residentiel-sobriete/epcis.csv'

// Source : data/residentiel-sobriete/manifest.json, colonnes de epcis.csv
const EPCI_COLUMNS = ['code_epci', 'electricity_mwh', 'natural_gas_mwh'] as const

// Source : SDES, Données locales de consommation d'électricité et de gaz naturel à la maille EPCI : « secret » remplace la consommation protégée par le secret statistique
const SECRET_VALUE = 'secret'

// Source : choix de conception, non validé : une ligne sous secret statistique compte pour 0, comme dans le jeu départemental (choix 4 de residentiel_sobriete)
const SECRET_LINE_MWH = toBig('0')

function toEpciLine({
  dataset,
  row,
}: {
  dataset: string
  row: Readonly<Record<string, string>>
}): Result<EpciLine, InvalidDataset> {
  return Result.combine([
    requireColumn({ dataset, row, column: 'code_epci' }),
    requireColumn({ dataset, row, column: 'conso_mwh' }),
  ]).andThen(([epci, text]) =>
    text === SECRET_VALUE
      ? ok({ epci, mwh: undefined })
      : parseBigWithExponent(text)
          .mapErr(() =>
            invalidDataset({
              dataset,
              reason: 'unreadable',
              detail: `conso_mwh=${text} is not a decimal number`,
            }),
          )
          .map((mwh) => ({ epci, mwh })),
  )
}

function readEpciLines({
  dataset,
  csv,
}: {
  dataset: string
  csv: string
}): Result<readonly EpciLine[], InvalidDataset> {
  return parseCsvText({ text: csv, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) => Result.combine(rows.map((row) => toEpciLine({ dataset, row }))))
}

function sumByEpci(lines: readonly EpciLine[]): ReadonlyMap<string, BigNumber> {
  return lines.reduce(
    (totals, { epci, mwh }) =>
      totals.set(epci, (totals.get(epci) ?? SECRET_LINE_MWH).plus(mwh ?? SECRET_LINE_MWH)),
    new Map<string, BigNumber>(),
  )
}

function toRoundedMwh({
  column,
  totals,
  epci,
}: {
  column: string
  totals: ReadonlyMap<string, BigNumber>
  epci: string
}): Result<string, InvalidDataset> {
  return roundToLoaderPrecision({
    dataset: outputDataset,
    column,
    text: (totals.get(epci) ?? SECRET_LINE_MWH).toFixed(),
  })
}

function buildEpciConsumption({
  epciElectricityCsv,
  epciGasCsv,
}: EpciConsumptionSources): Result<EpciConsumption, InvalidDataset> {
  return Result.combine([
    readEpciLines({ dataset: electricityDataset, csv: epciElectricityCsv }),
    readEpciLines({ dataset: gasDataset, csv: epciGasCsv }),
  ]).andThen(([electricityLines, gasLines]) => {
    const electricity = sumByEpci(electricityLines)
    const gas = sumByEpci(gasLines)
    const epcis = [...new Set([...electricity.keys(), ...gas.keys()])].sort()
    return Result.combine(
      epcis.map((epci) =>
        Result.combine([
          toRoundedMwh({ column: 'electricity_mwh', totals: electricity, epci }),
          toRoundedMwh({ column: 'natural_gas_mwh', totals: gas, epci }),
        ]).map(([electricityMwh, naturalGasMwh]) => [epci, electricityMwh, naturalGasMwh] as const),
      ),
    ).andThen((rows) =>
      toCsvText({ dataset: outputDataset, columns: EPCI_COLUMNS, rows }).map((csv) => ({
        csv,
        epciCount: rows.length,
        electricityMwh: sum(rows.map(([, mwh]) => toBig(mwh))).toFixed(),
        naturalGasMwh: sum(rows.map(([, , mwh]) => toBig(mwh))).toFixed(),
        secretElectricityLineCount: electricityLines.filter(({ mwh }) => mwh === undefined).length,
        secretGasLineCount: gasLines.filter(({ mwh }) => mwh === undefined).length,
      })),
    )
  })
}

export { buildEpciConsumption }
export type { EpciConsumption, EpciConsumptionSources }
