import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculatePratiquesStockantesReduction,
  type StockingPracticeSurfaces,
} from './calculate-pratiques-stockantes-reduction.ts'

const NO_SURFACE: Record<keyof StockingPracticeSurfaces, string> = {
  intermediateCrops: '0',
  permanentVineyardGrassing: '0',
  winterIntercropVineyard: '0',
  agroforestry: '0',
  temporaryGrasslandExtension: '0',
}

function reductionOf(overrides: Partial<Record<keyof StockingPracticeSurfaces, string>>): string {
  const filledSurfaces = { ...NO_SURFACE, ...overrides }
  return calculatePratiquesStockantesReduction({
    intermediateCrops: quantity<'Hectares'>(filledSurfaces.intermediateCrops),
    permanentVineyardGrassing: quantity<'Hectares'>(filledSurfaces.permanentVineyardGrassing),
    winterIntercropVineyard: quantity<'Hectares'>(filledSurfaces.winterIntercropVineyard),
    agroforestry: quantity<'Hectares'>(filledSurfaces.agroforestry),
    temporaryGrasslandExtension: quantity<'Hectares'>(filledSurfaces.temporaryGrasslandExtension),
  }).toFixed()
}

describe('calculatePratiquesStockantesReduction', () => {
  it('ne stocke rien sans surface', () => {
    expect(reductionOf({})).toBe('0')
  })

  it.each([
    ['intermediateCrops', '0.753'],
    ['permanentVineyardGrassing', '1.534'],
    ['winterIntercropVineyard', '1.087'],
    ['agroforestry', '4.078'],
    ['temporaryGrasslandExtension', '0.903'],
  ] as const)('1 ha de %s stocke %s tCO2e par an', (practice, expected) => {
    expect(reductionOf({ [practice]: '1' })).toBe(expected)
  })

  it('additionne les cinq pratiques : 1 ha de chacune stocke 8,355 tCO2e par an', () => {
    expect(
      reductionOf({
        intermediateCrops: '1',
        permanentVineyardGrassing: '1',
        winterIntercropVineyard: '1',
        agroforestry: '1',
        temporaryGrasslandExtension: '1',
      }),
    ).toBe('8.355')
  })

  it('1 000 ha de cultures intermédiaires et 200 ha d’agroforesterie stockent 1 568,6 tCO2e par an', () => {
    expect(reductionOf({ intermediateCrops: '1000', agroforestry: '200' })).toBe('1568.6')
  })

  it('la réduction est linéaire : f(a) + f(b) = f(a + b)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (first, second) => {
          const sumOfReductions = quantity<'Tonnes'>(
            reductionOf({ agroforestry: String(first) }),
          ).plus(reductionOf({ agroforestry: String(second) }))
          expect(sumOfReductions.toFixed()).toBe(reductionOf({ agroforestry: String(first + second) }))
        },
      ),
    )
  })
})
