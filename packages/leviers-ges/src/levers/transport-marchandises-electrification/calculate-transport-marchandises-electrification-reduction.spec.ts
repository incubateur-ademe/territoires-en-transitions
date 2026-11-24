import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateElectrifiedShare,
  calculateTransportMarchandisesElectrificationReduction,
} from './calculate-transport-marchandises-electrification-reduction.ts'

function reductionOf({
  share = '0.2',
  tonneKilometres = '1000000',
  thermal = '0.08',
  electric = '0.0467',
}: {
  share?: string
  tonneKilometres?: string
  thermal?: string
  electric?: string
}): string {
  return calculateTransportMarchandisesElectrificationReduction({
    electrifiedShare: quantity<'Fraction'>(share),
    tonneKilometres: quantity<'TonneKilometres'>(tonneKilometres),
    thermalEmissionFactor: quantity<'KgCo2ePerTonneKilometre'>(thermal),
    electricEmissionFactor: quantity<'KgCo2ePerTonneKilometre'>(electric),
  }).toFixed()
}

describe('calculateTransportMarchandisesElectrificationReduction', () => {
  it('évite 6,66 tCO2e : 20 % de 1 000 000 t.km électrifiés, de 0,08 à 0,0467 kgCO2e/t.km', () => {
    expect(reductionOf({})).toBe('6.66')
  })

  it('évite 33,3 tCO2e quand tout le parc thermique est électrifié', () => {
    expect(reductionOf({ share: '1' })).toBe('33.3')
  })

  it('évite zéro sans électrification', () => {
    expect(reductionOf({ share: '0' })).toBe('0')
  })

  it('donne un résultat négatif quand le facteur électrique dépasse le thermique : −6,66 tCO2e', () => {
    expect(reductionOf({ thermal: '0.0467', electric: '0.08' })).toBe('-6.66')
  })
})

describe('calculateElectrifiedShare', () => {
  it.each([
    ['garde la part demandée quand elle tient dans le parc thermique', '0.5', '0.25', '0.5'],
    ['plafonne la part demandée à la part thermique', '0.9', '0.25', '0.75'],
    ['accepte exactement la part thermique', '0.75', '0.25', '0.75'],
    ['ne laisse rien à électrifier dans un parc tout zéro émission', '0.1', '1', '0'],
  ])('%s', (_label, requested, zeroEmission, expected) => {
    expect(
      calculateElectrifiedShare({
        requested: quantity<'Fraction'>(requested),
        zeroEmissionShare: quantity<'Fraction'>(zeroEmission),
      }).toFixed(),
    ).toBe(expected)
  })
})
