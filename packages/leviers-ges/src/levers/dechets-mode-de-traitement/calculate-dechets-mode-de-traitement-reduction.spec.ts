import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import type { WasteTypeTreatment } from '../../domain/waste-treatment.ts'
import {
  calculateDechetsModeDeTraitementReduction,
  type TreatmentShifts,
} from './calculate-dechets-mode-de-traitement-reduction.ts'

const SHIFTS: TreatmentShifts = {
  storageToIncineration: quantity<'Fraction'>('0.5'),
  storageToMaterialRecovery: quantity<'Fraction'>('0.25'),
  incinerationToMaterialRecovery: quantity<'Fraction'>('0.1'),
}

const NO_SHIFT: TreatmentShifts = {
  storageToIncineration: quantity<'Fraction'>('0'),
  storageToMaterialRecovery: quantity<'Fraction'>('0'),
  incinerationToMaterialRecovery: quantity<'Fraction'>('0'),
}

const RESIDUAL_WASTE: WasteTypeTreatment = {
  wasteCode: '20 03 01',
  storageTonnes: quantity<'Tonnes'>('100'),
  incinerationTonnes: quantity<'Tonnes'>('200'),
  storageEmissionFactor: quantity<'KgCo2ePerTonne'>('400'),
  incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('100'),
}

function reductionOf(shifts: TreatmentShifts, wasteTypes: readonly WasteTypeTreatment[]): string {
  return calculateDechetsModeDeTraitementReduction({ shifts, wasteTypes }).toFixed()
}

describe('calculateDechetsModeDeTraitementReduction', () => {
  it('additionne les trois changements : 15 000 + 2 000 + 10 000 kgCO2e, soit 27 tCO2e', () => {
    expect(reductionOf(SHIFTS, [RESIDUAL_WASTE])).toBe('27')
  })

  it('ne change rien quand aucun déchet ne change de mode', () => {
    expect(reductionOf(NO_SHIFT, [RESIDUAL_WASTE])).toBe('0')
  })

  it.each([
    ['du stockage vers l’incinération', { ...NO_SHIFT, storageToIncineration: SHIFTS.storageToIncineration }, '15'],
    [
      'de l’incinération vers la valorisation',
      { ...NO_SHIFT, incinerationToMaterialRecovery: SHIFTS.incinerationToMaterialRecovery },
      '2',
    ],
    [
      'du stockage vers la valorisation',
      { ...NO_SHIFT, storageToMaterialRecovery: SHIFTS.storageToMaterialRecovery },
      '10',
    ],
  ])('compte seul le changement %s', (_label, shifts, expected) => {
    expect(reductionOf(shifts, [RESIDUAL_WASTE])).toBe(expected)
  })

  it('compte un résultat négatif quand l’incinération émet plus que le stockage', () => {
    const plastic: WasteTypeTreatment = {
      ...RESIDUAL_WASTE,
      storageEmissionFactor: quantity<'KgCo2ePerTonne'>('41'),
      incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('2769'),
    }
    const storageToIncineration = { ...NO_SHIFT, storageToIncineration: quantity<'Fraction'>('1') }
    expect(reductionOf(storageToIncineration, [plastic])).toBe('-272.8')
  })

  it('ignore les termes dont le facteur du stockage manque : seul 2 tCO2e de l’incinération reste', () => {
    const withoutStorageFactor = { ...RESIDUAL_WASTE, storageEmissionFactor: undefined }
    expect(reductionOf(SHIFTS, [withoutStorageFactor])).toBe('2')
  })

  it('ignore les termes dont le facteur de l’incinération manque : seul 10 tCO2e du stockage reste', () => {
    const withoutIncinerationFactor = { ...RESIDUAL_WASTE, incinerationEmissionFactor: undefined }
    expect(reductionOf(SHIFTS, [withoutIncinerationFactor])).toBe('10')
  })

  it('additionne les types de déchets : 27 tCO2e et −0,3425 tCO2e pour le verre', () => {
    const glass: WasteTypeTreatment = {
      ...RESIDUAL_WASTE,
      wasteCode: '20 01 02',
      storageTonnes: quantity<'Tonnes'>('10'),
      incinerationTonnes: quantity<'Tonnes'>('0'),
      storageEmissionFactor: quantity<'KgCo2ePerTonne'>('41'),
      incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('130'),
    }
    expect(reductionOf(SHIFTS, [RESIDUAL_WASTE, glass])).toBe('26.6575')
  })

  it('renvoie zéro sans aucun déchet', () => {
    expect(reductionOf(SHIFTS, [])).toBe('0')
  })
})
