import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateTransportMarchandisesEfficaciteReduction,
  ECODRIVING_POTENTIAL,
} from './calculate-transport-marchandises-efficacite-reduction.ts'

function reductionOf({
  ecodriving = '0',
  loadFactorIncrease = '0',
  tonneKilometres = '1000000',
  emissionFactor = '0.08',
}: {
  ecodriving?: string
  loadFactorIncrease?: string
  tonneKilometres?: string
  emissionFactor?: string
}): string {
  return calculateTransportMarchandisesEfficaciteReduction({
    ecodrivingApplication: quantity<'Fraction'>(ecodriving),
    loadFactorIncrease: quantity<'RelativeChange'>(loadFactorIncrease),
    tonneKilometres: quantity<'TonneKilometres'>(tonneKilometres),
    emissionFactor: quantity<'KgCo2ePerTonneKilometre'>(emissionFactor),
  })
    .decimalPlaces(6)
    .toFixed()
}

describe('calculateTransportMarchandisesEfficaciteReduction', () => {
  it('évite 16,666667 tCO2e : 50 % d’écoconduite et 20 % de chargement en plus donnent 20,8333 % de baisse de 80 tCO2e', () => {
    expect(reductionOf({ ecodriving: '0.5', loadFactorIncrease: '0.2' })).toBe('16.666667')
  })

  it('évite 4 tCO2e avec 50 % d’écoconduite seule : 5 % de baisse de 80 tCO2e', () => {
    expect(reductionOf({ ecodriving: '0.5' })).toBe('4')
  })

  it('évite 13,333333 tCO2e avec 20 % de chargement en plus seul : 16,67 % de baisse de 80 tCO2e', () => {
    expect(reductionOf({ loadFactorIncrease: '0.2' })).toBe('13.333333')
  })

  it('évite 8 tCO2e avec 100 % d’écoconduite : le potentiel de 10 % de 80 tCO2e', () => {
    expect(reductionOf({ ecodriving: '1' })).toBe('8')
  })

  it('évite zéro sans écoconduite ni chargement en plus', () => {
    expect(reductionOf({})).toBe('0')
  })

  it('utilise un potentiel d’écoconduite de 10 %', () => {
    expect(ECODRIVING_POTENTIAL.toFixed()).toBe('0.1')
  })
})
