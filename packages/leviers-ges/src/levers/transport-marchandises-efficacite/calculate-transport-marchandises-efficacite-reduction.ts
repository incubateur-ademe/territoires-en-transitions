import type BigNumber from 'bignumber.js'
import { toBig } from '../../domain/big-number.ts'
import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerTonneKilometre,
  type RelativeChange,
  type TonneKilometres,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'

// Source : élément neutre de la multiplication
const ONE: BigNumber = toBig('1')

// Source : documentation fonctionnelle PlanET (juin 2026), 7.3.9, p. 66 : le potentiel d'écoconduite des poids lourds est celui du transport de personnes, soit 10 % par défaut (7.3.4.3, p. 61) ; la documentation écrit aussi « 15 % » à la p. 66, contradiction tranchée par l'équipe le 2026-11-19 en faveur de 10 % ; remplace le « ~15% » de DonneesReference!D29
const ECODRIVING_POTENTIAL: Fraction = quantity<'Fraction'>('0.1')

function calculateReductionFraction({
  ecodrivingApplication,
  loadFactorIncrease,
}: {
  ecodrivingApplication: Fraction
  loadFactorIncrease: RelativeChange
}): BigNumber {
  const increasedLoadFactor = ONE.plus(loadFactorIncrease)
  const loadFactorEffect = ONE.dividedBy(increasedLoadFactor)
  const ecodrivingGain = ecodrivingApplication.times(ECODRIVING_POTENTIAL)
  const ecodrivingEffect = ONE.minus(ecodrivingGain)
  const remainingEmissions = loadFactorEffect.times(ecodrivingEffect)
  return ONE.minus(remainingEmissions)
}

function calculateTransportMarchandisesEfficaciteReduction({
  ecodrivingApplication,
  loadFactorIncrease,
  tonneKilometres,
  emissionFactor,
}: {
  ecodrivingApplication: Fraction
  loadFactorIncrease: RelativeChange
  tonneKilometres: TonneKilometres
  emissionFactor: KgCo2ePerTonneKilometre
}): TonnesCo2ePerYear {
  const reductionFraction = calculateReductionFraction({ ecodrivingApplication, loadFactorIncrease })
  const annualEmissionsKg = tonneKilometres.times(emissionFactor)
  const avoidedEmissionsKg = annualEmissionsKg.times(reductionFraction)
  return quantity<'TonnesCo2ePerYear'>(avoidedEmissionsKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateTransportMarchandisesEfficaciteReduction, ECODRIVING_POTENTIAL }
