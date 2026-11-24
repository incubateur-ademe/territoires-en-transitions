import type BigNumber from 'bignumber.js'
import { sum } from '../../domain/big-number.ts'
import {
  convertToKgPerKwh,
  ELECTRICITY_APPLIED_EMISSION_FACTOR,
  NATURAL_GAS_EMISSION_FACTOR,
} from '../../domain/emission-factors.ts'
import { quantity } from '../../domain/units.ts'
import type {
  Fraction,
  KgCo2ePerGigajoule,
  KgCo2ePerKwh,
  MegawattHours,
  TonnesCo2ePerYear,
} from '../../domain/units.ts'
import type { AgriculturalConsumption } from './data/agricultural-consumption.ts'

type ReductionFractions = {
  readonly electricity: Fraction
  readonly naturalGas: Fraction
  readonly petroleumProducts: Fraction
  readonly heat: Fraction
}

// Source : OMINEA, base BDD_OMINEA_A_EF v23.1, NAPFUE 205 (gazole), SNAP 080601 (engins spéciaux, agriculture, échappement moteur), 2024 :
// 74,5229 kg CO2/GJ, arrondi à 74,52 (choix de conception, non validé, comme le fioul domestique du résidentiel). Documentation fonctionnelle PlanET (juin 2026),
// 7.1.3.6, p. 51 : « le facteur d'émission des produits pétroliers est celui du Gazole non routier » ; remplace le fioul lourd à 78 kg/GJ (PlanET V1, forme « FE du fioul lourd »), la documentation l'emportant sur le tableur
const PETROLEUM_PRODUCTS_EMISSION_FACTOR: KgCo2ePerGigajoule = quantity<'KgCo2ePerGigajoule'>('74.52')

function calculateAvoidedEmissions({
  consumption,
  reductionFraction,
  emissionFactor,
}: {
  consumption: MegawattHours
  reductionFraction: Fraction
  emissionFactor: KgCo2ePerKwh
}): BigNumber {
  const reducedConsumption = consumption.times(reductionFraction)
  return reducedConsumption.times(emissionFactor)
}

function calculateBatimentsMachinesAgricolesReduction({
  reductionFractions,
  consumption,
  heatEmissionFactor,
}: {
  reductionFractions: ReductionFractions
  consumption: AgriculturalConsumption
  heatEmissionFactor: KgCo2ePerKwh
}): TonnesCo2ePerYear {
  const electricityAvoidedEmissions = calculateAvoidedEmissions({
    consumption: consumption.electricity,
    reductionFraction: reductionFractions.electricity,
    emissionFactor: ELECTRICITY_APPLIED_EMISSION_FACTOR,
  })
  const naturalGasAvoidedEmissions = calculateAvoidedEmissions({
    consumption: consumption.naturalGas,
    reductionFraction: reductionFractions.naturalGas,
    emissionFactor: convertToKgPerKwh(NATURAL_GAS_EMISSION_FACTOR),
  })
  const petroleumProductsAvoidedEmissions = calculateAvoidedEmissions({
    consumption: consumption.petroleumProducts,
    reductionFraction: reductionFractions.petroleumProducts,
    emissionFactor: convertToKgPerKwh(PETROLEUM_PRODUCTS_EMISSION_FACTOR),
  })
  const heatAvoidedEmissions = calculateAvoidedEmissions({
    consumption: consumption.heat,
    reductionFraction: reductionFractions.heat,
    emissionFactor: heatEmissionFactor,
  })
  const avoidedEmissionsByVector = [
    electricityAvoidedEmissions,
    naturalGasAvoidedEmissions,
    petroleumProductsAvoidedEmissions,
    heatAvoidedEmissions,
  ]
  const totalAvoidedEmissions = sum(avoidedEmissionsByVector)
  return quantity<'TonnesCo2ePerYear'>(totalAvoidedEmissions.toFixed())
}

export { calculateBatimentsMachinesAgricolesReduction }
export type { ReductionFractions }
