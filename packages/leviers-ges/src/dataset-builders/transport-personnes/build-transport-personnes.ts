import type BigNumber from 'bignumber.js'
import { Result } from 'neverthrow'
import { sum } from '../../domain/big-number.ts'
import type { InvalidDataset } from '../../domain/data-source.ts'
import { roundToLoaderPrecision } from '../round-to-loader-precision.ts'
import { toCsvText } from '../to-csv-text.ts'
import { calculateFleetEmissionFactor } from './calculate-fleet-emission-factor.ts'
import {
  calculateNationalFleetFactors,
  type NationalFleetFactors,
} from './calculate-national-fleet-factors.ts'
import {
  calculateTerritoryPassengerKm,
  type TerritoryPassengerKm,
} from './calculate-territory-passenger-km.ts'
import {
  BUS_EMISSION_FACTORS_KG_PER_KM,
  BUS_THERMAL_EMISSION_FACTORS_KG_PER_KM,
  CAR_EMISSION_FACTORS_KG_PER_KM,
  CAR_THERMAL_EMISSION_FACTORS_KG_PER_KM,
} from './fleet-emission-factors.ts'
import { fleetCountsOf, groupFleetByTerritory, type FleetByTerritory } from './group-fleet.ts'
import { readCommutingPassengerKm } from './read-commuting-passenger-km.ts'
import { readFleet } from './read-fleet.ts'
import type { TransportSources } from './read-transport-sources.ts'
import type { SourceLevel } from './source-level.ts'

// Source : choix de structure du jeu, non validé : les colonnes numériques écrites dans regions.csv, departements.csv et epcis.csv, après la colonne du code
const NUMERIC_COLUMNS = [
  'car_weekly_passenger_km',
  'public_transport_weekly_passenger_km',
  'car_emission_factor_kg_per_km',
  'bus_emission_factor_kg_per_km',
  'car_fleet_unclassified_share',
  'bus_fleet_unclassified_share',
  'car_fleet_classified',
  'bus_fleet_classified',
  'car_thermal_emission_factor_kg_per_km',
  'bus_thermal_emission_factor_kg_per_km',
  'car_thermal_fleet_share',
  'bus_thermal_fleet_share',
] as const

type NumericColumn = (typeof NUMERIC_COLUMNS)[number]

type ControlTotals = {
  readonly car_weekly_passenger_km: string
  readonly public_transport_weekly_passenger_km: string
}

type LevelBuild = {
  readonly csv: string
  readonly territoryCount: number
  readonly controlTotals: ControlTotals
}

type TransportBuild = {
  readonly regions: LevelBuild
  readonly departements: LevelBuild
  readonly epcis: LevelBuild
}

type OutputLevel = {
  readonly level: SourceLevel
  readonly keyColumn: string
  readonly dataset: string
}

const regionsOutput: OutputLevel = {
  level: 'REG',
  keyColumn: 'code_region',
  dataset: 'transport-personnes/regions.csv',
}

const departementsOutput: OutputLevel = {
  level: 'DEP',
  keyColumn: 'code_departement',
  dataset: 'transport-personnes/departements.csv',
}

const epcisOutput: OutputLevel = {
  level: 'EPCI',
  keyColumn: 'code_epci',
  dataset: 'transport-personnes/epcis.csv',
}

function toRoundedFields({
  dataset,
  valueByColumn,
}: {
  dataset: string
  valueByColumn: Readonly<Record<NumericColumn, BigNumber>>
}): Result<readonly string[], InvalidDataset> {
  return Result.combine(
    NUMERIC_COLUMNS.map((column) =>
      roundToLoaderPrecision({ dataset, column, text: valueByColumn[column].toFixed() }),
    ),
  )
}

function toTerritoryRow({
  dataset,
  territory,
  fleetByTerritory,
  national,
}: {
  dataset: string
  territory: TerritoryPassengerKm
  fleetByTerritory: FleetByTerritory
  national: NationalFleetFactors
}): Result<readonly string[], InvalidDataset> {
  const { level, code } = territory
  const carFleet = calculateFleetEmissionFactor({
    counts: fleetCountsOf({ fleetByTerritory, level, code, group: 'VP' }),
    emissionFactors: CAR_EMISSION_FACTORS_KG_PER_KM,
  })
  const busFleet = calculateFleetEmissionFactor({
    counts: fleetCountsOf({ fleetByTerritory, level, code, group: 'TC_routier' }),
    emissionFactors: BUS_EMISSION_FACTORS_KG_PER_KM,
  })
  const carThermalFleet = calculateFleetEmissionFactor({
    counts: fleetCountsOf({ fleetByTerritory, level, code, group: 'VP' }),
    emissionFactors: CAR_THERMAL_EMISSION_FACTORS_KG_PER_KM,
  })
  const busThermalFleet = calculateFleetEmissionFactor({
    counts: fleetCountsOf({ fleetByTerritory, level, code, group: 'TC_routier' }),
    emissionFactors: BUS_THERMAL_EMISSION_FACTORS_KG_PER_KM,
  })
  return toRoundedFields({
    dataset,
    valueByColumn: {
      car_weekly_passenger_km: territory.carWeeklyPassengerKm,
      public_transport_weekly_passenger_km: territory.publicTransportWeeklyPassengerKm,
      car_emission_factor_kg_per_km: carFleet.emissionFactor ?? national.car,
      bus_emission_factor_kg_per_km: busFleet.emissionFactor ?? national.bus,
      car_fleet_unclassified_share: carFleet.unclassifiedShare,
      bus_fleet_unclassified_share: busFleet.unclassifiedShare,
      car_fleet_classified: carFleet.classifiedVehicles,
      bus_fleet_classified: busFleet.classifiedVehicles,
      car_thermal_emission_factor_kg_per_km: carThermalFleet.emissionFactor ?? national.carThermal,
      bus_thermal_emission_factor_kg_per_km: busThermalFleet.emissionFactor ?? national.busThermal,
      car_thermal_fleet_share: carThermalFleet.classifiedShare,
      bus_thermal_fleet_share: busThermalFleet.classifiedShare,
    },
  }).map((fields) => [code, ...fields])
}

function toControlTotals(territories: readonly TerritoryPassengerKm[]): ControlTotals {
  const carWeeklyPassengerKm = sum(territories.map((territory) => territory.carWeeklyPassengerKm))
  const publicTransportWeeklyPassengerKm = sum(
    territories.map((territory) => territory.publicTransportWeeklyPassengerKm),
  )
  return {
    car_weekly_passenger_km: carWeeklyPassengerKm.toFixed(),
    public_transport_weekly_passenger_km: publicTransportWeeklyPassengerKm.toFixed(),
  }
}

function buildLevel({
  output,
  territories,
  fleetByTerritory,
  national,
}: {
  output: OutputLevel
  territories: readonly TerritoryPassengerKm[]
  fleetByTerritory: FleetByTerritory
  national: NationalFleetFactors
}): Result<LevelBuild, InvalidDataset> {
  const { dataset, keyColumn } = output
  return Result.combine(
    territories.map((territory) => toTerritoryRow({ dataset, territory, fleetByTerritory, national })),
  ).andThen((rows) =>
    toCsvText({ dataset, columns: [keyColumn, ...NUMERIC_COLUMNS], rows }).map((csv) => ({
      csv,
      territoryCount: rows.length,
      controlTotals: toControlTotals(territories),
    })),
  )
}

function buildTransportPersonnes({
  commutingCsv,
  fleetCsv,
}: TransportSources): Result<TransportBuild, InvalidDataset> {
  return Result.combine([readCommutingPassengerKm(commutingCsv), readFleet(fleetCsv)]).andThen(
    ([commuting, fleet]) =>
      calculateNationalFleetFactors(fleet).andThen((national) => {
        const passengerKm = calculateTerritoryPassengerKm(commuting)
        const fleetByTerritory = groupFleetByTerritory(fleet)
        const buildOutput = (output: OutputLevel) =>
          buildLevel({
            output,
            territories: passengerKm.filter(({ level }) => level === output.level),
            fleetByTerritory,
            national,
          })
        return Result.combine([
          buildOutput(regionsOutput),
          buildOutput(departementsOutput),
          buildOutput(epcisOutput),
        ]).map(([regions, departements, epcis]) => ({ regions, departements, epcis }))
      }),
  )
}

export { buildTransportPersonnes }
export type { TransportBuild }
