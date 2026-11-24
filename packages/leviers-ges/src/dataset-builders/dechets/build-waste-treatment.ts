import { groupBy, sortBy } from 'es-toolkit'
import { Result, ok } from 'neverthrow'
import { requireColumn } from '../../application/require-column.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { DataRow, InvalidDataset } from '../../domain/data-source.ts'
import { parseCsvText } from '../../infrastructure/csv/parse-csv-text.ts'
import { toInvalidDataset } from '../../infrastructure/csv/violation.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCityCode } from '../to-city-code.ts'
import { toCsvText } from '../to-csv-text.ts'

type TreatmentMode = 'storage' | 'incineration'

type TreatmentFlow = {
  readonly communeCode: string
  readonly wasteCode: string
  readonly treatmentMode: TreatmentMode
  readonly tonnes: string
}

type WasteTreatmentBuild = {
  readonly flowsCsv: string
  readonly emissionFactorsCsv: string
  readonly flowCount: number
  readonly totalTonnes: string
  readonly storageTonnes: string
  readonly incinerationTonnes: string
}

const irepDataset = 'dechets/sources/irep-2022-dechets-municipaux-traitement.csv'
const emissionFactorsDataset = 'dechets/sources/fe-dechets-tableur.csv'

// Source : data/dechets/manifest.json, colonnes de treatment-flows.csv
const FLOWS_COLUMNS = [
  'flow_id',
  'commune_code',
  'waste_code',
  'treatment_mode',
  'tonnes_per_year',
] as const

// Source : data/dechets/manifest.json, colonnes de emission-factors.csv
const EMISSION_FACTORS_COLUMNS = [
  'waste_code',
  'storage_emission_factor_kg_per_tonne',
  'incineration_emission_factor_kg_per_tonne',
] as const

// Source : tableur PlanET V1, DonneesReference!A49 « stockées (ou incinérées sans récupération d'énergie) » et A50 « incinérées avec récupération d'énergie » ; codes d'opération D1, D5, D10 et R1 de la directive 2008/98/CE, annexes I et II (correspondance : choix de conception, non validé)
const TREATMENT_MODE_BY_OPERATION_CODE: ReadonlyMap<string, TreatmentMode> = new Map([
  ['D1', 'storage'],
  ['D5', 'storage'],
  ['D10', 'storage'],
  ['R1', 'incineration'],
])

// Source : tableur PlanET V1, FE_déchets : « — » marque un facteur absent de la Base Empreinte
const MISSING_EMISSION_FACTOR_MARK = '—'

function toFlow(row: DataRow): Result<readonly TreatmentFlow[], InvalidDataset> {
  const dataset = irepDataset
  return Result.combine([
    requireColumn({ dataset, row, column: 'code_operation' }),
    requireColumn({ dataset, row, column: 'code_insee' }),
    requireColumn({ dataset, row, column: 'code_dechet' }),
    requireColumn({ dataset, row, column: 'quantite_traitee_t' }),
  ]).andThen(([operationCode, communeCode, wasteCode, tonnesText]) => {
    const treatmentMode = TREATMENT_MODE_BY_OPERATION_CODE.get(operationCode)
    if (treatmentMode === undefined) return ok([])
    return roundToLoaderPrecision({ dataset, column: 'quantite_traitee_t', text: tonnesText }).map(
      (tonnes) => {
        const hasNoTonnes = toBig(tonnes).isZero()
        if (hasNoTonnes) return []
        return [{ communeCode: toCityCode(communeCode), wasteCode, treatmentMode, tonnes }]
      },
    )
  })
}

function toFlowId({ communeCode, wasteCode, treatmentMode }: TreatmentFlow): string {
  return `${communeCode}:${wasteCode}:${treatmentMode}`
}

function consolidate(flows: readonly TreatmentFlow[]): readonly TreatmentFlow[] {
  return Object.values(groupBy(flows, toFlowId)).flatMap((sameFlow) =>
    sameFlow.slice(0, 1).map((flow) => ({ ...flow, tonnes: tonnesOf(sameFlow) })),
  )
}

function toFlowsCsv(flows: readonly TreatmentFlow[]): Result<string, InvalidDataset> {
  return toCsvText({
    dataset: irepDataset,
    columns: FLOWS_COLUMNS,
    rows: sortBy(flows, [toFlowId]).map((flow) => [
      toFlowId(flow),
      flow.communeCode,
      flow.wasteCode,
      flow.treatmentMode,
      flow.tonnes,
    ]),
  })
}

function tonnesOf(flows: readonly TreatmentFlow[]): string {
  return sum(flows.map(({ tonnes }) => toBig(tonnes))).toFixed()
}

function toEmissionFactor({
  row,
  column,
}: {
  row: DataRow
  column: string
}): Result<string, InvalidDataset> {
  const dataset = emissionFactorsDataset
  return requireColumn({ dataset, row, column }).andThen((text) => {
    const isMissing = text === MISSING_EMISSION_FACTOR_MARK
    if (isMissing) return ok('')
    return roundToLoaderPrecision({ dataset, column, text })
  })
}

function toEmissionFactorsCsv(
  emissionFactorsText: string,
): Result<string, InvalidDataset> {
  const dataset = emissionFactorsDataset
  return parseCsvText({ text: emissionFactorsText, delimiter: ',' })
    .mapErr(toInvalidDataset(dataset))
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          Result.combine([
            requireColumn({ dataset, row, column: 'code_irep' }),
            toEmissionFactor({ row, column: 'fe_stockage_kgco2e_t' }),
            toEmissionFactor({ row, column: 'fe_incineration_kgco2e_t' }),
          ]),
        ),
      ),
    )
    .andThen((factorsByWasteCode) =>
      toCsvText({
        dataset,
        columns: EMISSION_FACTORS_COLUMNS,
        rows: sortBy(factorsByWasteCode, [([wasteCode]) => wasteCode]),
      }),
    )
}

function buildWasteTreatment({
  irepCsv,
  emissionFactorsText,
}: {
  irepCsv: string
  emissionFactorsText: string
}): Result<WasteTreatmentBuild, InvalidDataset> {
  return parseCsvText({ text: irepCsv, delimiter: ',' })
    .mapErr(toInvalidDataset(irepDataset))
    .andThen((rows) => Result.combine(rows.map(toFlow)))
    .map((flowsPerRow) => consolidate(flowsPerRow.flat()))
    .andThen((flows) =>
      Result.combine([toFlowsCsv(flows), toEmissionFactorsCsv(emissionFactorsText)]).map(
        ([flowsCsv, emissionFactorsCsv]) => ({
          flowsCsv,
          emissionFactorsCsv,
          flowCount: flows.length,
          totalTonnes: tonnesOf(flows),
          storageTonnes: tonnesOf(flows.filter(({ treatmentMode }) => treatmentMode === 'storage')),
          incinerationTonnes: tonnesOf(
            flows.filter(({ treatmentMode }) => treatmentMode === 'incineration'),
          ),
        }),
      ),
    )
}

export { buildWasteTreatment }
