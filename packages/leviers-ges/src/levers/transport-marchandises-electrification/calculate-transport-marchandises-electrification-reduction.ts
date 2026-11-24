import { calculateThermalShare } from '../../domain/heavy-vehicle-emission-factor.ts'
import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerTonneKilometre,
  type TonneKilometres,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'

function calculateElectrifiedShare({
  requested,
  zeroEmissionShare,
}: {
  requested: Fraction
  zeroEmissionShare: Fraction
}): Fraction {
  const thermalShare = calculateThermalShare(zeroEmissionShare)
  return requested.isGreaterThan(thermalShare) ? thermalShare : requested
}

function calculateTransportMarchandisesElectrificationReduction({
  electrifiedShare,
  tonneKilometres,
  thermalEmissionFactor,
  electricEmissionFactor,
}: {
  electrifiedShare: Fraction
  tonneKilometres: TonneKilometres
  thermalEmissionFactor: KgCo2ePerTonneKilometre
  electricEmissionFactor: KgCo2ePerTonneKilometre
}): TonnesCo2ePerYear {
  const electrifiedTonneKilometres = tonneKilometres.times(electrifiedShare)
  const emissionFactorGap = thermalEmissionFactor.minus(electricEmissionFactor)
  const avoidedEmissionsKg = electrifiedTonneKilometres.times(emissionFactorGap)
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export {
  calculateElectrifiedShare,
  calculateTransportMarchandisesElectrificationReduction,
}
