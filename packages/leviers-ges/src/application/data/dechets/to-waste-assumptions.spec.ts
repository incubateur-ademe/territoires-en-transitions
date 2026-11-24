import { describe, expect, it } from 'vitest'
import { quantity } from '../../../domain/units.ts'
import type { WasteTypeTreatment } from '../../../domain/waste-treatment.ts'
import { toWasteAssumptions } from './to-waste-assumptions.ts'

const RESIDUAL_WASTE: WasteTypeTreatment = {
  wasteCode: '20 03 01',
  storageTonnes: quantity<'Tonnes'>('100'),
  incinerationTonnes: quantity<'Tonnes'>('200'),
  storageEmissionFactor: quantity<'KgCo2ePerTonne'>('412'),
  incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('374'),
}

describe('toWasteAssumptions', () => {
  it('renvoie le périmètre des sites, même quand tous les déchets ont un facteur', () => {
    const assumptions = toWasteAssumptions([RESIDUAL_WASTE])
    expect(Object.keys(assumptions)).toEqual(['wasteScope'])
    expect(assumptions['wasteScope']?.value).toBe('sites de traitement situés dans le territoire')
    expect(assumptions['wasteScope']?.limit).toContain('un territoire sans site de traitement')
  })

  it('renvoie le périmètre des sites pour un territoire sans déchet', () => {
    expect(Object.keys(toWasteAssumptions([]))).toEqual(['wasteScope'])
  })

  it('renvoie les tonnes sans facteur : 30 t stockées sans facteur de stockage et 5 t incinérées sans facteur d’incinération', () => {
    const soil: WasteTypeTreatment = {
      wasteCode: '20 02 02',
      storageTonnes: quantity<'Tonnes'>('30'),
      incinerationTonnes: quantity<'Tonnes'>('7'),
      storageEmissionFactor: undefined,
      incinerationEmissionFactor: quantity<'KgCo2ePerTonne'>('1'),
    }
    const electronics: WasteTypeTreatment = {
      wasteCode: '20 01 36',
      storageTonnes: quantity<'Tonnes'>('1'),
      incinerationTonnes: quantity<'Tonnes'>('5'),
      storageEmissionFactor: quantity<'KgCo2ePerTonne'>('1'),
      incinerationEmissionFactor: undefined,
    }
    const assumptions = toWasteAssumptions([RESIDUAL_WASTE, soil, electronics])
    expect(assumptions['wasteTonnesWithoutEmissionFactor']?.value).toBe('35')
  })
})
