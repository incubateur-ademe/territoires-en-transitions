import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import { calculateHaiesReduction, HEDGE_STORAGE_FACTOR } from './calculate-haies-reduction.ts'

function reductionOfKilometres(kilometres: string): string {
  return calculateHaiesReduction(quantity<'Kilometres'>(kilometres), HEDGE_STORAGE_FACTOR).toFixed()
}

describe('calculateHaiesReduction', () => {
  it('1 km de haie planté stocke 1.17 tCO2e par an', () => {
    expect(reductionOfKilometres('1')).toBe('1.17')
  })

  it('0 km de haie planté ne stocke rien', () => {
    expect(reductionOfKilometres('0')).toBe('0')
  })

  it('le facteur de stockage vaut le carbone du sol 0.77 plus la biomasse racinaire 0.4', () => {
    expect(HEDGE_STORAGE_FACTOR.isEqualTo(quantity<'TCo2ePerKmPerYear'>('0.77').plus('0.4'))).toBe(true)
  })

  it('la réduction est linéaire : f(a) + f(b) = f(a + b)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1_000_000 }),
        fc.integer({ min: 0, max: 1_000_000 }),
        (first, second) => {
          const sumOfReductions = quantity<'Tonnes'>(reductionOfKilometres(String(first))).plus(
            reductionOfKilometres(String(second)),
          )
          expect(sumOfReductions.toFixed()).toBe(reductionOfKilometres(String(first + second)))
        },
      ),
    )
  })

  it('1000000 km donnent 1170000 tCO2e par an sans erreur de flottant', () => {
    expect(reductionOfKilometres('1000000')).toBe('1170000')
  })
})
