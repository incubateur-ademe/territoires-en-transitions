import { sortBy } from 'es-toolkit'
import { Result } from 'neverthrow'
import { sum, toBig } from '../../domain/big-number.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import type { DepartmentPetroleum } from './apportion-oil-sales.ts'
import type { RegionalEnergy } from './split-regional-petroleum.ts'

type ControlTotals = Readonly<Record<string, string>>

type RegionRow = {
  readonly regionCode: string
  readonly electricityGwh: string
  readonly naturalGasGwh: string
  readonly fuelOilGwh: string
  readonly liquefiedPetroleumGasGwh: string
  readonly heatGwh: string
}

type DepartmentRow = {
  readonly departementCode: string
  readonly electricityMwh: string
  readonly naturalGasMwh: string
  readonly fuelOilMwh: string
  readonly liquefiedPetroleumGasMwh: string
}

const tablesDataset = 'residentiel-sobriete'

// Source : data/residentiel-sobriete/manifest.json, colonnes de regions.csv
const REGIONS_COLUMNS = [
  'code_region',
  'electricity_gwh',
  'natural_gas_gwh',
  'fuel_oil_gwh',
  'lpg_gwh',
  'heat_gwh',
] as const

// Source : data/residentiel-sobriete/manifest.json, colonnes de departements.csv
const DEPARTEMENTS_COLUMNS = [
  'code_departement',
  'electricity_mwh',
  'natural_gas_mwh',
  'fuel_oil_mwh',
  'lpg_mwh',
] as const

// Source : choix de conception, non validé : un département absent des extraits IRIS d'électricité ou de gaz n'a pas de ligne, sa consommation vaut 0 (gaz : 2A, 2B et 48 en 2024)
const ABSENT_DEPARTMENT_CONSUMPTION = '0'

function totalOf(amounts: readonly string[]): string {
  return sum(amounts.map((amount) => toBig(amount))).toFixed()
}

function toRegionRows(
  regionalEnergies: readonly RegionalEnergy[],
): Result<readonly RegionRow[], InvalidDataset> {
  const dataset = tablesDataset
  return Result.combine(
    regionalEnergies.map((regionalEnergy) =>
      Result.combine([
        roundToLoaderPrecision({
          dataset,
          column: 'electricity_gwh',
          text: regionalEnergy.electricityGwh.toFixed(),
        }),
        roundToLoaderPrecision({
          dataset,
          column: 'natural_gas_gwh',
          text: regionalEnergy.naturalGasGwh.toFixed(),
        }),
        roundToLoaderPrecision({
          dataset,
          column: 'fuel_oil_gwh',
          text: regionalEnergy.fuelOilGwh.toFixed(),
        }),
        roundToLoaderPrecision({
          dataset,
          column: 'lpg_gwh',
          text: regionalEnergy.liquefiedPetroleumGasGwh.toFixed(),
        }),
        roundToLoaderPrecision({
          dataset,
          column: 'heat_gwh',
          text: regionalEnergy.heatGwh.toFixed(),
        }),
      ]).map(
        ([electricityGwh, naturalGasGwh, fuelOilGwh, liquefiedPetroleumGasGwh, heatGwh]) => ({
          regionCode: regionalEnergy.regionCode,
          electricityGwh,
          naturalGasGwh,
          fuelOilGwh,
          liquefiedPetroleumGasGwh,
          heatGwh,
        }),
      ),
    ),
  )
}

function toDepartmentRows({
  petroleum,
  electricity,
  naturalGas,
}: {
  petroleum: readonly DepartmentPetroleum[]
  electricity: ReadonlyMap<string, string>
  naturalGas: ReadonlyMap<string, string>
}): readonly DepartmentRow[] {
  return sortBy(petroleum, [({ departementCode }) => departementCode]).map(
    ({ departementCode, fuelOilMwh, liquefiedPetroleumGasMwh }) => ({
      departementCode,
      electricityMwh: electricity.get(departementCode) ?? ABSENT_DEPARTMENT_CONSUMPTION,
      naturalGasMwh: naturalGas.get(departementCode) ?? ABSENT_DEPARTMENT_CONSUMPTION,
      fuelOilMwh,
      liquefiedPetroleumGasMwh,
    }),
  )
}

function toRegionsCsv(rows: readonly RegionRow[]): Result<string, InvalidDataset> {
  return toCsvText({
    dataset: tablesDataset,
    columns: REGIONS_COLUMNS,
    rows: rows.map((row) => [
      row.regionCode,
      row.electricityGwh,
      row.naturalGasGwh,
      row.fuelOilGwh,
      row.liquefiedPetroleumGasGwh,
      row.heatGwh,
    ]),
  })
}

function toDepartementsCsv(rows: readonly DepartmentRow[]): Result<string, InvalidDataset> {
  return toCsvText({
    dataset: tablesDataset,
    columns: DEPARTEMENTS_COLUMNS,
    rows: rows.map((row) => [
      row.departementCode,
      row.electricityMwh,
      row.naturalGasMwh,
      row.fuelOilMwh,
      row.liquefiedPetroleumGasMwh,
    ]),
  })
}

function toRegionControlTotals(rows: readonly RegionRow[]): ControlTotals {
  return {
    electricity_gwh: totalOf(rows.map(({ electricityGwh }) => electricityGwh)),
    natural_gas_gwh: totalOf(rows.map(({ naturalGasGwh }) => naturalGasGwh)),
    fuel_oil_gwh: totalOf(rows.map(({ fuelOilGwh }) => fuelOilGwh)),
    lpg_gwh: totalOf(rows.map(({ liquefiedPetroleumGasGwh }) => liquefiedPetroleumGasGwh)),
    heat_gwh: totalOf(rows.map(({ heatGwh }) => heatGwh)),
  }
}

function toDepartmentControlTotals(rows: readonly DepartmentRow[]): ControlTotals {
  return {
    electricity_mwh: totalOf(rows.map(({ electricityMwh }) => electricityMwh)),
    natural_gas_mwh: totalOf(rows.map(({ naturalGasMwh }) => naturalGasMwh)),
    fuel_oil_mwh: totalOf(rows.map(({ fuelOilMwh }) => fuelOilMwh)),
    lpg_mwh: totalOf(rows.map(({ liquefiedPetroleumGasMwh }) => liquefiedPetroleumGasMwh)),
  }
}

export {
  toDepartementsCsv,
  toDepartmentControlTotals,
  toDepartmentRows,
  toRegionControlTotals,
  toRegionRows,
  toRegionsCsv,
}
export type { ControlTotals, DepartmentRow, RegionRow }
