import { sum } from '../../domain/big-number.ts'
import {
  convertToKgPerKwh,
  ELECTRICITY_APPLIED_EMISSION_FACTOR,
  FUEL_OIL_EMISSION_FACTOR,
  LIQUEFIED_PETROLEUM_GAS_EMISSION_FACTOR,
  NATURAL_GAS_EMISSION_FACTOR,
} from '../../domain/emission-factors.ts'
import { quantity } from '../../domain/units.ts'
import type {
  Fraction,
  KgCo2ePerKwh,
  MegawattHours,
  TonnesCo2ePerYear,
} from '../../domain/units.ts'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'

type SobrietyFractions = {
  readonly households: Fraction
  readonly consumptionReduction: Fraction
}

function calculateEmissions({
  consumption,
  emissionFactor,
}: {
  consumption: MegawattHours
  emissionFactor: KgCo2ePerKwh
}): TonnesCo2ePerYear {
  return quantity<'TonnesCo2ePerYear'>(consumption.times(emissionFactor).toFixed())
}

function calculateResidentielSobrieteReduction({
  sobrietyFractions,
  consumption,
  heatEmissionFactor,
}: {
  sobrietyFractions: SobrietyFractions
  consumption: ResidentialConsumption
  heatEmissionFactor: KgCo2ePerKwh
}): TonnesCo2ePerYear {
  const electricityEmissions = calculateEmissions({
    consumption: consumption.electricity,
    emissionFactor: ELECTRICITY_APPLIED_EMISSION_FACTOR,
  })
  const naturalGasEmissions = calculateEmissions({
    consumption: consumption.naturalGas,
    emissionFactor: convertToKgPerKwh(NATURAL_GAS_EMISSION_FACTOR),
  })
  const fuelOilEmissions = calculateEmissions({
    consumption: consumption.fuelOil,
    emissionFactor: convertToKgPerKwh(FUEL_OIL_EMISSION_FACTOR),
  })
  const liquefiedPetroleumGasEmissions = calculateEmissions({
    consumption: consumption.liquefiedPetroleumGas,
    emissionFactor: convertToKgPerKwh(LIQUEFIED_PETROLEUM_GAS_EMISSION_FACTOR),
  })
  const heatEmissions = calculateEmissions({
    consumption: consumption.heat,
    emissionFactor: heatEmissionFactor,
  })
  const emissionsByVector = [
    electricityEmissions,
    naturalGasEmissions,
    fuelOilEmissions,
    liquefiedPetroleumGasEmissions,
    heatEmissions,
  ]
  const totalEmissions = sum(emissionsByVector)
  const reductionShare = sobrietyFractions.households.times(sobrietyFractions.consumptionReduction)
  const avoidedEmissions = totalEmissions.times(reductionShare)
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissions.toFixed())
}

export { calculateResidentielSobrieteReduction }
export type { SobrietyFractions }
