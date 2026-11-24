import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import type { WasteTypeTreatment } from '../../domain/waste-treatment.ts'
import {
  calculateDechetsSobrieteReduction,
  type WasteReductions,
} from './calculate-dechets-sobriete-reduction.ts'

const REDUCTIONS: WasteReductions = {
  storage: quantity<'Fraction'>('0.5'),
  incineration: quantity<'Fraction'>('0.1'),
}

const NO_REDUCTION: WasteReductions = {
  storage: quantity<'Fraction'>('0'),
  incineration: quantity<'Fraction'>('0'),
}

const RESIDUAL_WASTE: WasteTypeTreatment = {
  wasteCode: '20 03 01',
  storageTonnes: quantity<'Tonnes'>('100'),
  incinerationTonnes: quantity<'Tonnes'>('200'),
  storageEmissionFactor: quantity<'KgCo2ePerTonne'>('400'),
  incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('100'),
}

function reductionOf(
  reductions: WasteReductions,
  wasteTypes: readonly WasteTypeTreatment[],
): string {
  return calculateDechetsSobrieteReduction({ reductions, wasteTypes }).toFixed()
}

describe('calculateDechetsSobrieteReduction', () => {
  it('additionne la réduction du stockage et celle de l’incinération : 20 000 + 2 000 kgCO2e, soit 22 tCO2e', () => {
    expect(reductionOf(REDUCTIONS, [RESIDUAL_WASTE])).toBe('22')
  })

  it('ne réduit rien à 0 %', () => {
    expect(reductionOf(NO_REDUCTION, [RESIDUAL_WASTE])).toBe('0')
  })

  it('évite tous les déchets traités à 100 % : 40 000 + 20 000 kgCO2e, soit 60 tCO2e', () => {
    const everything: WasteReductions = {
      storage: quantity<'Fraction'>('1'),
      incineration: quantity<'Fraction'>('1'),
    }
    expect(reductionOf(everything, [RESIDUAL_WASTE])).toBe('60')
  })

  it.each([
    ['du stockage seule', { ...NO_REDUCTION, storage: REDUCTIONS.storage }, '20'],
    ['de l’incinération seule', { ...NO_REDUCTION, incineration: REDUCTIONS.incineration }, '2'],
  ])('compte la réduction %s', (_label, reductions, expected) => {
    expect(reductionOf(reductions, [RESIDUAL_WASTE])).toBe(expected)
  })

  it('ignore le stockage quand son facteur manque : seul 2 tCO2e de l’incinération reste', () => {
    const withoutStorageFactor = { ...RESIDUAL_WASTE, storageEmissionFactor: undefined }
    expect(reductionOf(REDUCTIONS, [withoutStorageFactor])).toBe('2')
  })

  it('ignore l’incinération quand son facteur manque : seul 20 tCO2e du stockage reste', () => {
    const withoutIncinerationFactor = { ...RESIDUAL_WASTE, incinerationEmissionFactor: undefined }
    expect(reductionOf(REDUCTIONS, [withoutIncinerationFactor])).toBe('20')
  })

  it('additionne les types de déchets : 22 tCO2e et 0,205 tCO2e pour le verre', () => {
    const glass: WasteTypeTreatment = {
      ...RESIDUAL_WASTE,
      wasteCode: '20 01 02',
      storageTonnes: quantity<'Tonnes'>('10'),
      incinerationTonnes: quantity<'Tonnes'>('0'),
      storageEmissionFactor: quantity<'KgCo2ePerTonne'>('41'),
      incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('130'),
    }
    expect(reductionOf(REDUCTIONS, [RESIDUAL_WASTE, glass])).toBe('22.205')
  })

  it('renvoie zéro sans aucun déchet', () => {
    expect(reductionOf(REDUCTIONS, [])).toBe('0')
  })
})
