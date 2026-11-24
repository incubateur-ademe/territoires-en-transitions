import { Result } from 'neverthrow'
import type { InvalidDataset } from '../../domain/data-source.ts'
import type { SheetRows } from '../sheet-rows.ts'
import { apportionOilSales } from './apportion-oil-sales.ts'
import { buildHeatNetworks } from './build-heat-networks.ts'
import { checkDepartmentsHaveSales } from './check-departments-have-sales.ts'
import { readCerenFuelConsumption } from './read-ceren-fuel-consumption.ts'
import { readDepartmentConsumption } from './read-department-consumption.ts'
import { readOilSales, type OilSales } from './read-oil-sales.ts'
import { readRegionalBilan, type RegionalBilan } from './read-regional-bilan.ts'
import {
  toDepartementsCsv,
  toDepartmentControlTotals,
  toDepartmentRows,
  toRegionControlTotals,
  toRegionRows,
  toRegionsCsv,
  type ControlTotals,
  type DepartmentRow,
  type RegionRow,
} from './residential-energy-tables.ts'
import {
  calculateFuelShares,
  toRegionalEnergy,
  toRegionalPetroleumMwh,
  type FuelShares,
} from './split-regional-petroleum.ts'

type ResidentialEnergySources = {
  readonly regionalBilanCsv: string
  readonly cerenRows: SheetRows
  readonly irisElectricityCsv: string
  readonly irisGasCsv: string
  readonly oilSalesCsv: string
  readonly heatCsv: string
}

type ResidentialEnergyBuild = {
  readonly regionsCsv: string
  readonly departementsCsv: string
  readonly heatNetworksCsv: string
  readonly controlTotals: {
    readonly regions: ControlTotals
    readonly departements: ControlTotals
    readonly heatNetworks: ControlTotals
  }
  readonly secretNetworkCount: number
}

type EnergyTables = {
  readonly regionRows: readonly RegionRow[]
  readonly departmentRows: readonly DepartmentRow[]
}

const irisElectricityDataset =
  'residentiel-sobriete/sources/sdes-electricite-iris-2024-residentiel-par-departement.csv'

const irisGasDataset = 'residentiel-sobriete/sources/sdes-gaz-iris-2024-residentiel-par-departement.csv'

function buildEnergyTables({
  bilans,
  shares,
  electricity,
  naturalGas,
  sales,
}: {
  bilans: readonly RegionalBilan[]
  shares: FuelShares
  electricity: ReadonlyMap<string, string>
  naturalGas: ReadonlyMap<string, string>
  sales: readonly OilSales[]
}): Result<EnergyTables, InvalidDataset> {
  const regionalEnergies = bilans.map((bilan) => toRegionalEnergy({ bilan, shares }))
  const regionalPetroleum = new Map(
    regionalEnergies.map((regionalEnergy) => [
      regionalEnergy.regionCode,
      toRegionalPetroleumMwh(regionalEnergy),
    ]),
  )
  return Result.combine([
    toRegionRows(regionalEnergies),
    apportionOilSales({ sales, regionalPetroleum }),
  ]).map(([regionRows, petroleum]) => ({
    regionRows,
    departmentRows: toDepartmentRows({ petroleum, electricity, naturalGas }),
  }))
}

function buildResidentialEnergy(
  sources: ResidentialEnergySources,
): Result<ResidentialEnergyBuild, InvalidDataset> {
  return Result.combine([
    readRegionalBilan(sources.regionalBilanCsv),
    readCerenFuelConsumption(sources.cerenRows).andThen(calculateFuelShares),
    readDepartmentConsumption({ dataset: irisElectricityDataset, csv: sources.irisElectricityCsv }),
    readDepartmentConsumption({ dataset: irisGasDataset, csv: sources.irisGasCsv }),
    readOilSales(sources.oilSalesCsv),
    buildHeatNetworks(sources.heatCsv),
  ]).andThen(([bilans, shares, electricity, naturalGas, sales, heatNetworks]) =>
    Result.combine([
      checkDepartmentsHaveSales({ consumptionByDepartment: electricity, sales }),
      checkDepartmentsHaveSales({ consumptionByDepartment: naturalGas, sales }),
    ])
      .andThen(() => buildEnergyTables({ bilans, shares, electricity, naturalGas, sales }))
      .andThen(
        ({ regionRows, departmentRows }) => {
          const regionsCsvResult = toRegionsCsv(regionRows)
          const departementsCsvResult = toDepartementsCsv(departmentRows)
          return Result.combine([regionsCsvResult, departementsCsvResult]).map(
            ([regionsCsv, departementsCsv]) => ({
              regionsCsv,
              departementsCsv,
              heatNetworksCsv: heatNetworks.csv,
              controlTotals: {
                regions: toRegionControlTotals(regionRows),
                departements: toDepartmentControlTotals(departmentRows),
                heatNetworks: { delivered_mwh: heatNetworks.totalResidentialDeliveredMwh },
              },
              secretNetworkCount: heatNetworks.secretNetworkCount,
            }),
          )
        },
      ),
  )
}

export { buildResidentialEnergy }
export type { ResidentialEnergySources }
