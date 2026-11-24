import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateFertilisationAzoteeReduction,
  NITROGEN_SPREADING_EMISSION_FACTOR,
} from './calculate-fertilisation-azotee-reduction.ts'

function reductionOf({ fraction, tonnes }: { fraction: string; tonnes: string }): string {
  return calculateFertilisationAzoteeReduction({
    nitrogenReductionFraction: quantity<'Fraction'>(fraction),
    deliveredNitrogen: quantity<'Tonnes'>(tonnes),
  }).toFixed()
}

describe('calculateFertilisationAzoteeReduction', () => {
  it('évite 5,733 tCO2e par tonne d’azote supprimée : 1 000 t, tout supprimé, évitent 5 733 tCO2e', () => {
    expect(reductionOf({ fraction: '1', tonnes: '1000' })).toBe('5733')
  })

  it('évite 573,3 tCO2e pour 10 % de 1 000 t d’azote', () => {
    expect(reductionOf({ fraction: '0.1', tonnes: '1000' })).toBe('573.3')
  })

  it('évite 0 quand rien n’est supprimé', () => {
    expect(reductionOf({ fraction: '0', tonnes: '1000' })).toBe('0')
  })

  it('évite 0 sans azote livré', () => {
    expect(reductionOf({ fraction: '1', tonnes: '0' })).toBe('0')
  })

  it('utilise le facteur 5,733 kgCO2e par kg d’azote', () => {
    expect(NITROGEN_SPREADING_EMISSION_FACTOR.toFixed()).toBe('5.733')
  })
})
