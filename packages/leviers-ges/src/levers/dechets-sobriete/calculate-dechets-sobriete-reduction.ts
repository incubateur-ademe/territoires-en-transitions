import type BigNumber from 'bignumber.js'
import { sum } from '../../domain/big-number.ts'
import { KILOGRAMS_PER_TONNE } from '../../domain/mass-conversions.ts'
import {
  quantity,
  type Fraction,
  type KgCo2ePerTonne,
  type Tonnes,
  type TonnesCo2ePerYear,
} from '../../domain/units.ts'
import { NO_EMISSIONS_KG, type WasteTypeTreatment } from '../../domain/waste-treatment.ts'

type WasteReductions = {
  readonly storage: Fraction
  readonly incineration: Fraction
}

function calculateReductionKg({
  reduction,
  tonnes,
  emissionFactor,
}: {
  reduction: Fraction
  tonnes: Tonnes
  emissionFactor: KgCo2ePerTonne | undefined
}): BigNumber {
  if (emissionFactor === undefined) return NO_EMISSIONS_KG
  const reducedTonnes = tonnes.times(reduction)
  return reducedTonnes.times(emissionFactor)
}

function calculateWasteTypeAvoidedKg({
  reductions,
  wasteType,
}: {
  reductions: WasteReductions
  wasteType: WasteTypeTreatment
}): BigNumber {
  const storageReductionKg = calculateReductionKg({
    reduction: reductions.storage,
    tonnes: wasteType.storageTonnes,
    emissionFactor: wasteType.storageEmissionFactor,
  })
  const incinerationReductionKg = calculateReductionKg({
    reduction: reductions.incineration,
    tonnes: wasteType.incinerationTonnes,
    emissionFactor: wasteType.incinerationEmissionFactor,
  })
  return sum([storageReductionKg, incinerationReductionKg])
}

function calculateDechetsSobrieteReduction({
  reductions,
  wasteTypes,
}: {
  reductions: WasteReductions
  wasteTypes: readonly WasteTypeTreatment[]
}): TonnesCo2ePerYear {
  const avoidedKg = sum(
    wasteTypes.map((wasteType) => calculateWasteTypeAvoidedKg({ reductions, wasteType })),
  )
  return quantity<'TonnesCo2ePerYear'>(avoidedKg.dividedBy(KILOGRAMS_PER_TONNE).toFixed())
}

export { calculateDechetsSobrieteReduction }
export type { WasteReductions }
