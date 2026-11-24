import { sum } from '../../domain/big-number.ts'
import {
  convertToKgPerKwh,
  ELECTRICITY_APPLIED_EMISSION_FACTOR,
  FUEL_OIL_EMISSION_FACTOR,
  NATURAL_GAS_EMISSION_FACTOR,
} from '../../domain/emission-factors.ts'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'
import { quantity } from '../../domain/units.ts'
import type { Fraction, KgCo2ePerKwh, MegawattHours, TonnesCo2ePerYear } from '../../domain/units.ts'
import { HEATING_AND_HOT_WATER_SHARE } from '../../domain/residential-heating-shares.ts'
import {
  CURRENT_EFFICIENCY,
  TARGET_EFFICIENCY,
  type HeatingVector,
} from './heating-reference.ts'

type TargetShares = Readonly<Record<HeatingVector, Fraction>>

// Source : documentation fonctionnelle PlanET (juin 2026), pp. 52-53 : le bois est absent des données INSEE et sa consommation de base vaut 0 ; limite reconnue
const NO_WOOD_CONSUMPTION: MegawattHours = quantity<'MegawattHours'>('0')

// Source : documentation fonctionnelle PlanET (juin 2026), pp. 52-53 : facteur d'émission du bois à 0, les émissions sont comptées au prélèvement de bois
const WOOD_EMISSION_FACTOR: KgCo2ePerKwh = quantity<'KgCo2ePerKwh'>('0')

// Source : choix de conception, non validé : un territoire sans énergie de chauffage et d'ECS n'a pas de mix actuel
const NO_CURRENT_SHARE: Fraction = quantity<'Fraction'>('0')

// Source : choix de conception, non validé : un territoire sans énergie de chauffage évite 0 tCO2e plutôt qu'une division par zéro
const NO_AVOIDED_EMISSIONS: TonnesCo2ePerYear = quantity<'TonnesCo2ePerYear'>('0')

function currentFinalEnergy(consumption: ResidentialConsumption): Readonly<Record<HeatingVector, MegawattHours>> {
  const final = (vector: Exclude<HeatingVector, 'wood'>, total: MegawattHours): MegawattHours =>
    quantity<'MegawattHours'>(total.times(HEATING_AND_HOT_WATER_SHARE[vector]).toFixed())
  return {
    electricity: final('electricity', consumption.electricity),
    naturalGas: final('naturalGas', consumption.naturalGas),
    fuelOil: final('fuelOil', consumption.fuelOil),
    wood: NO_WOOD_CONSUMPTION,
    heat: final('heat', consumption.heat),
  }
}

type CurrentUsefulShares = {
  readonly usefulEnergy: MegawattHours
  readonly shares: TargetShares
}

function calculateCurrentUsefulShares(consumption: ResidentialConsumption): CurrentUsefulShares {
  const current = currentFinalEnergy(consumption)
  const usefulOf = (vector: HeatingVector): MegawattHours =>
    quantity<'MegawattHours'>(current[vector].times(CURRENT_EFFICIENCY[vector]).toFixed())
  const usefulEnergy = quantity<'MegawattHours'>(
    sum([
      usefulOf('electricity'),
      usefulOf('naturalGas'),
      usefulOf('fuelOil'),
      usefulOf('wood'),
      usefulOf('heat'),
    ]).toFixed(),
  )
  const shareOf = (vector: HeatingVector): Fraction =>
    usefulEnergy.isZero()
      ? NO_CURRENT_SHARE
      : quantity<'Fraction'>(usefulOf(vector).dividedBy(usefulEnergy).toFixed())
  return {
    usefulEnergy,
    shares: {
      electricity: shareOf('electricity'),
      naturalGas: shareOf('naturalGas'),
      fuelOil: shareOf('fuelOil'),
      wood: shareOf('wood'),
      heat: shareOf('heat'),
    },
  }
}

function calculateResidentielChangementSystemeChauffageReduction({
  targetShares,
  consumption,
  heatEmissionFactor,
}: {
  targetShares: TargetShares
  consumption: ResidentialConsumption
  heatEmissionFactor: KgCo2ePerKwh
}): TonnesCo2ePerYear {
  const emissionFactors: Readonly<Record<HeatingVector, KgCo2ePerKwh>> = {
    electricity: ELECTRICITY_APPLIED_EMISSION_FACTOR,
    naturalGas: convertToKgPerKwh(NATURAL_GAS_EMISSION_FACTOR),
    fuelOil: convertToKgPerKwh(FUEL_OIL_EMISSION_FACTOR),
    wood: WOOD_EMISSION_FACTOR,
    heat: heatEmissionFactor,
  }
  const vectors: readonly HeatingVector[] = ['electricity', 'naturalGas', 'fuelOil', 'wood', 'heat']
  const current = currentFinalEnergy(consumption)
  const usefulEnergy = sum(vectors.map((vector) => current[vector].times(CURRENT_EFFICIENCY[vector])))
  if (usefulEnergy.isZero()) return NO_AVOIDED_EMISSIONS
  const avoidedByVector = vectors.map((vector) => {
    const targetUsefulEnergy = usefulEnergy.times(targetShares[vector])
    const targetFinalEnergy = targetUsefulEnergy.dividedBy(TARGET_EFFICIENCY[vector])
    const avoidedEnergy = current[vector].minus(targetFinalEnergy)
    return avoidedEnergy.times(emissionFactors[vector])
  })
  return quantity<'TonnesCo2ePerYear'>(sum(avoidedByVector).toFixed())
}

export { calculateCurrentUsefulShares, calculateResidentielChangementSystemeChauffageReduction }
export type { CurrentUsefulShares, TargetShares }
