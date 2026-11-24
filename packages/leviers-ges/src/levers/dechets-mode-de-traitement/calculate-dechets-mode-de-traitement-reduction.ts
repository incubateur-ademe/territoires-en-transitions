import type BigNumber from 'bignumber.js'
import { sum } from '../../domain/big-number.ts'
import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import { quantity, type Fraction, type TonnesCo2ePerYear } from '../../domain/units.ts'
import { NO_EMISSIONS_KG, type WasteTypeTreatment } from '../../domain/waste-treatment.ts'

type TreatmentShifts = {
  readonly storageToIncineration: Fraction
  readonly storageToMaterialRecovery: Fraction
  readonly incinerationToMaterialRecovery: Fraction
}

function calculateStorageToIncinerationKg({
  shift,
  wasteType,
}: {
  shift: Fraction
  wasteType: WasteTypeTreatment
}): BigNumber {
  const { storageTonnes, storageEmissionFactor, incinerationEmissionFactor } = wasteType
  if (storageEmissionFactor === undefined || incinerationEmissionFactor === undefined) {
    return NO_EMISSIONS_KG
  }
  const emissionFactorGap = storageEmissionFactor.minus(incinerationEmissionFactor)
  const shiftedTonnes = storageTonnes.times(shift)
  return shiftedTonnes.times(emissionFactorGap)
}

function calculateIncinerationToMaterialRecoveryKg({
  shift,
  wasteType,
}: {
  shift: Fraction
  wasteType: WasteTypeTreatment
}): BigNumber {
  const { incinerationTonnes, incinerationEmissionFactor } = wasteType
  if (incinerationEmissionFactor === undefined) return NO_EMISSIONS_KG
  const shiftedTonnes = incinerationTonnes.times(shift)
  return shiftedTonnes.times(incinerationEmissionFactor)
}

function calculateStorageToMaterialRecoveryKg({
  shift,
  wasteType,
}: {
  shift: Fraction
  wasteType: WasteTypeTreatment
}): BigNumber {
  const { storageTonnes, storageEmissionFactor } = wasteType
  if (storageEmissionFactor === undefined) return NO_EMISSIONS_KG
  const shiftedTonnes = storageTonnes.times(shift)
  return shiftedTonnes.times(storageEmissionFactor)
}

function calculateWasteTypeAvoidedKg({
  shifts,
  wasteType,
}: {
  shifts: TreatmentShifts
  wasteType: WasteTypeTreatment
}): BigNumber {
  const storageToIncinerationKg = calculateStorageToIncinerationKg({
    shift: shifts.storageToIncineration,
    wasteType,
  })
  const incinerationToMaterialRecoveryKg = calculateIncinerationToMaterialRecoveryKg({
    shift: shifts.incinerationToMaterialRecovery,
    wasteType,
  })
  const storageToMaterialRecoveryKg = calculateStorageToMaterialRecoveryKg({
    shift: shifts.storageToMaterialRecovery,
    wasteType,
  })
  return sum([storageToIncinerationKg, incinerationToMaterialRecoveryKg, storageToMaterialRecoveryKg])
}

function calculateDechetsModeDeTraitementReduction({
  shifts,
  wasteTypes,
}: {
  shifts: TreatmentShifts
  wasteTypes: readonly WasteTypeTreatment[]
}): TonnesCo2ePerYear {
  const avoidedKg = sum(wasteTypes.map((wasteType) => calculateWasteTypeAvoidedKg({ shifts, wasteType })))
  return quantity<'TonnesCo2ePerYear'>(avoidedKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateDechetsModeDeTraitementReduction }
export type { TreatmentShifts }
