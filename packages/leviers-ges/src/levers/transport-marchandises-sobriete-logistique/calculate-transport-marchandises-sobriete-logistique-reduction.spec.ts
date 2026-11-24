import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import { calculateTransportMarchandisesSobrieteLogistiqueReduction } from './calculate-transport-marchandises-sobriete-logistique-reduction.ts'

function reductionOf({
  reduction,
  tonneKilometres,
  emissionFactor,
}: {
  reduction: string
  tonneKilometres: string
  emissionFactor: string
}): string {
  return calculateTransportMarchandisesSobrieteLogistiqueReduction({
    roadFreightReduction: quantity<'Fraction'>(reduction),
    tonneKilometres: quantity<'TonneKilometres'>(tonneKilometres),
    emissionFactor: quantity<'KgCo2ePerTonneKilometre'>(emissionFactor),
  }).toFixed()
}

describe('calculateTransportMarchandisesSobrieteLogistiqueReduction', () => {
  it('évite 10 % de 1 000 000 t.km à 0,08 kgCO2e/t.km : 8 tCO2e', () => {
    expect(
      reductionOf({ reduction: '0.1', tonneKilometres: '1000000', emissionFactor: '0.08' }),
    ).toBe('8')
  })

  it('évite 80 tCO2e quand tout le transport routier disparaît', () => {
    expect(reductionOf({ reduction: '1', tonneKilometres: '1000000', emissionFactor: '0.08' })).toBe(
      '80',
    )
  })

  it.each([
    ['sans réduction', { reduction: '0', tonneKilometres: '1000000', emissionFactor: '0.08' }],
    ['sans t.km', { reduction: '1', tonneKilometres: '0', emissionFactor: '0.08' }],
    ['sans émission', { reduction: '1', tonneKilometres: '1000000', emissionFactor: '0' }],
  ])('évite 0 %s', (_label, input) => {
    expect(reductionOf(input)).toBe('0')
  })
})
