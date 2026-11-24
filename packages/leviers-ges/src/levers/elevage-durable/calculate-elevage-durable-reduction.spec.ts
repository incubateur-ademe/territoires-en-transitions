import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateElevageDurableReduction,
  type AnimalChange,
  type ManureModeShares,
} from './calculate-elevage-durable-reduction.ts'
import type { AnimalType } from './data/animal-types.ts'

function shares({
  liquid,
  solid,
  pasture,
  anaerobicDigestion = '0',
}: {
  liquid: string
  solid: string
  pasture: string
  anaerobicDigestion?: string
}): ManureModeShares {
  return {
    liquid: quantity<'Fraction'>(liquid),
    solid: quantity<'Fraction'>(solid),
    pasture: quantity<'Fraction'>(pasture),
    anaerobicDigestion: quantity<'Fraction'>(anaerobicDigestion),
  }
}

const DAIRY_COW_CURRENT_SHARES = shares({ liquid: '0.41', solid: '0.2', pasture: '0.39' })

function change({
  animalType,
  heads,
  headcountReduction = '0',
  entericEmissionReduction = '0',
  targetShares,
}: {
  animalType: AnimalType
  heads: string
  headcountReduction?: string
  entericEmissionReduction?: string
  targetShares: ManureModeShares
}): AnimalChange {
  return {
    animalType,
    headcount: quantity<'Heads'>(heads),
    headcountReduction: quantity<'Fraction'>(headcountReduction),
    entericEmissionReduction: quantity<'Fraction'>(entericEmissionReduction),
    targetShares,
  }
}

function reductionOf(...changes: AnimalChange[]): string {
  return calculateElevageDurableReduction(changes).decimalPlaces(6).toFixed()
}

describe('calculateElevageDurableReduction', () => {
  it('ne change rien quand rien ne change : 0 tCO2e', () => {
    expect(
      reductionOf(
        change({ animalType: 'dairyCows', heads: '1000', targetShares: DAIRY_COW_CURRENT_SHARES }),
      ),
    ).toBe('0')
  })

  it('évite toutes les émissions de 1 000 vaches laitières supprimées : 5 008,446832 tCO2e', () => {
    expect(
      reductionOf(
        change({
          animalType: 'dairyCows',
          heads: '1000',
          headcountReduction: '1',
          targetShares: DAIRY_COW_CURRENT_SHARES,
        }),
      ),
    ).toBe('5008.446832')
  })

  it('évite 10 % du facteur entérique de 1 000 vaches laitières : 28 × 121 × 1 000 × 10 % ÷ 1 000 = 338,8 tCO2e', () => {
    expect(
      reductionOf(
        change({
          animalType: 'dairyCows',
          heads: '1000',
          entericEmissionReduction: '0.1',
          targetShares: DAIRY_COW_CURRENT_SHARES,
        }),
      ),
    ).toBe('338.8')
  })

  it.each([
    ['tout à la pâture', shares({ liquid: '0', solid: '0', pasture: '1' }), '595.380024'],
    [
      'toute la méthanisation',
      shares({ liquid: '0', solid: '0', pasture: '0', anaerobicDigestion: '1' }),
      '1450.178779',
    ],
  ])('évite pour 1 000 vaches laitières dont les déjections vont %s : %s tCO2e', (_label, targetShares, expected) => {
    expect(reductionOf(change({ animalType: 'dairyCows', heads: '1000', targetShares }))).toBe(expected)
  })

  it('combine les trois leviers pour 500 truies : 150,907651 tCO2e', () => {
    expect(
      reductionOf(
        change({
          animalType: 'sows',
          heads: '500',
          headcountReduction: '0.2',
          entericEmissionReduction: '0.05',
          targetShares: shares({
            liquid: '0.5',
            solid: '0.1',
            pasture: '0.02',
            anaerobicDigestion: '0.38',
          }),
        }),
      ),
    ).toBe('150.907651')
  })

  it('ignore le lisier des ovins, sans facteur : 127,810233 tCO2e pour 2 000 brebis', () => {
    expect(
      reductionOf(
        change({
          animalType: 'sheep',
          heads: '2000',
          headcountReduction: '0.1',
          entericEmissionReduction: '0.1',
          targetShares: shares({ liquid: '0', solid: '0.5', pasture: '0.5' }),
        }),
      ),
    ).toBe('127.810233')
  })

  it('ne compte aucun méthane entérique pour 100 000 poules : 189,018662 tCO2e', () => {
    expect(
      reductionOf(
        change({
          animalType: 'layingHens',
          heads: '100000',
          headcountReduction: '0.2',
          targetShares: shares({ liquid: '0', solid: '0.5', pasture: '0.5' }),
        }),
      ),
    ).toBe('189.018662')
  })

  it('additionne les animaux : 5 008,446832 et 127,810233, soit 5 136,257065 tCO2e', () => {
    expect(
      reductionOf(
        change({
          animalType: 'dairyCows',
          heads: '1000',
          headcountReduction: '1',
          targetShares: DAIRY_COW_CURRENT_SHARES,
        }),
        change({
          animalType: 'sheep',
          heads: '2000',
          headcountReduction: '0.1',
          entericEmissionReduction: '0.1',
          targetShares: shares({ liquid: '0', solid: '0.5', pasture: '0.5' }),
        }),
      ),
    ).toBe('5136.257065')
  })

  it('renvoie zéro sans aucun animal', () => {
    expect(reductionOf()).toBe('0')
  })
})
