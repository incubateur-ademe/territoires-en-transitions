import { groupBy } from 'es-toolkit'
import { Result, err, ok } from 'neverthrow'
import {
  invalidDataset,
  type DataRow,
  type DataSource,
  type DataSourceError,
  type InvalidDataset,
} from '../../../domain/data-source.ts'
import { sum } from '../../../domain/big-number.ts'
import { quantity, type KgCo2ePerTonne, type Tonnes } from '../../../domain/units.ts'
import type { WasteTypeTreatment } from '../../../domain/waste-treatment.ts'
import {
  requireColumn,
  requireOptionalQuantityColumn,
  requireQuantityColumn,
} from '../../require-column.ts'

type TreatmentMode = 'storage' | 'incineration'

type TreatmentFlow = {
  readonly wasteCode: string
  readonly treatmentMode: TreatmentMode
  readonly tonnes: Tonnes
}

type WasteEmissionFactors = {
  readonly storage: KgCo2ePerTonne | undefined
  readonly incineration: KgCo2ePerTonne | undefined
}

const treatmentFlowsDataset = 'dechets/treatment-flows'
const emissionFactorsDataset = 'dechets/emission-factors'

function toTreatmentMode(value: string): Result<TreatmentMode, InvalidDataset> {
  if (value === 'storage' || value === 'incineration') return ok(value)
  return err(
    invalidDataset({
      dataset: treatmentFlowsDataset,
      reason: 'unreadable',
      detail: `treatment_mode=${value} is neither storage nor incineration`,
    }),
  )
}

function toTreatmentFlow(row: DataRow): Result<TreatmentFlow, InvalidDataset> {
  const dataset = treatmentFlowsDataset
  return Result.combine([
    requireColumn({ dataset, row, column: 'waste_code' }),
    requireColumn({ dataset, row, column: 'treatment_mode' }).andThen(toTreatmentMode),
    requireQuantityColumn<'Tonnes'>({ dataset, row, column: 'tonnes_per_year' }),
  ]).map(([wasteCode, treatmentMode, tonnes]) => ({ wasteCode, treatmentMode, tonnes }))
}

function readTreatmentFlows({
  dataSource,
  communes,
}: {
  dataSource: DataSource
  communes: ReadonlySet<string>
}): Result<readonly TreatmentFlow[], DataSourceError> {
  const dataset = treatmentFlowsDataset
  return dataSource
    .rows(dataset)
    .andThen((rows) =>
      Result.combine(
        rows.map((row) =>
          requireColumn({ dataset, row, column: 'commune_code' }).map((commune) => ({ row, commune })),
        ),
      ),
    )
    .andThen((flowsWithCommune) =>
      Result.combine(
        flowsWithCommune.filter(({ commune }) => communes.has(commune)).map(({ row }) => toTreatmentFlow(row)),
      ),
    )
}

function toEmissionFactors(
  row: DataRow,
): Result<readonly [string, WasteEmissionFactors], InvalidDataset> {
  const dataset = emissionFactorsDataset
  return Result.combine([
    requireColumn({ dataset, row, column: 'waste_code' }),
    requireOptionalQuantityColumn<'KgCo2ePerTonne'>({
      dataset,
      row,
      column: 'storage_emission_factor_kg_per_tonne',
    }),
    requireOptionalQuantityColumn<'KgCo2ePerTonne'>({
      dataset,
      row,
      column: 'incineration_emission_factor_kg_per_tonne',
    }),
  ]).map(([wasteCode, storage, incineration]) => [wasteCode, { storage, incineration }])
}

function readEmissionFactors(
  dataSource: DataSource,
): Result<ReadonlyMap<string, WasteEmissionFactors>, DataSourceError> {
  return dataSource
    .rows(emissionFactorsDataset)
    .andThen((rows) => Result.combine(rows.map(toEmissionFactors)))
    .map((factorsByWasteCode) => new Map(factorsByWasteCode))
}

function tonnesOf({
  flows,
  treatmentMode,
}: {
  flows: readonly TreatmentFlow[]
  treatmentMode: TreatmentMode
}): Tonnes {
  const sameMode = flows.filter((flow) => flow.treatmentMode === treatmentMode)
  return quantity<'Tonnes'>(sum(sameMode.map(({ tonnes }) => tonnes)).toFixed())
}

function toWasteTypeTreatment({
  wasteCode,
  flows,
  emissionFactors,
}: {
  wasteCode: string
  flows: readonly TreatmentFlow[]
  emissionFactors: ReadonlyMap<string, WasteEmissionFactors>
}): WasteTypeTreatment {
  const wasteFactors = emissionFactors.get(wasteCode)
  return {
    wasteCode,
    storageTonnes: tonnesOf({ flows, treatmentMode: 'storage' }),
    incinerationTonnes: tonnesOf({ flows, treatmentMode: 'incineration' }),
    storageEmissionFactor: wasteFactors?.storage,
    incinerationEmissionFactor: wasteFactors?.incineration,
  }
}

function readWasteTreatment({
  dataSource,
  communes,
}: {
  dataSource: DataSource
  communes: readonly string[]
}): Result<readonly WasteTypeTreatment[], DataSourceError> {
  return Result.combine([
    readTreatmentFlows({ dataSource, communes: new Set(communes) }),
    readEmissionFactors(dataSource),
  ]).map(([flows, emissionFactors]) =>
    Object.entries(groupBy(flows, ({ wasteCode }) => wasteCode)).map(([wasteCode, sameType]) =>
      toWasteTypeTreatment({ wasteCode, flows: sameType, emissionFactors }),
    ),
  )
}

export { readWasteTreatment }
