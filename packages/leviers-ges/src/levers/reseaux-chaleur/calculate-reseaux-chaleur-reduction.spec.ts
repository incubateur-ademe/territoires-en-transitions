import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import { quantity } from '../../domain/units.ts'
import { calculateReseauxChaleurReduction } from './calculate-reseaux-chaleur-reduction.ts'

function network(deliveredMwh: string, emissionFactor: string): HeatNetwork {
  return {
    deliveredMwh: quantity<'MegawattHours'>(deliveredMwh),
    emissionFactor: quantity<'KgCo2ePerKwh'>(emissionFactor),
  }
}

function reduction(fraction: string, networks: readonly HeatNetwork[]): string {
  return calculateReseauxChaleurReduction({
    reductionFraction: quantity<'Fraction'>(fraction),
    networks,
  }).toFixed()
}

describe('calculateReseauxChaleurReduction', () => {
  it('un réseau de 1000 MWh à 0.1 kgCO2e/kWh, réduit de moitié, évite 50 tCO2e', () => {
    expect(reduction('0.5', [network('1000', '0.1')])).toBe('50')
  })

  it('somme les réseaux : 1000 MWh à 0.1 et 2000 MWh à 0.05 émettent 200 tCO2e', () => {
    expect(reduction('1', [network('1000', '0.1'), network('2000', '0.05')])).toBe('200')
  })

  it('sans réseau, rien n’est évité', () => {
    expect(reduction('1', [])).toBe('0')
  })

  it('à 0 % de réduction, rien n’est évité', () => {
    expect(reduction('0', [network('27733931.728493', '0.0854')])).toBe('0')
  })

  it('un réseau sans émission n’évite rien', () => {
    expect(reduction('1', [network('1000', '0')])).toBe('0')
  })

  it('la réduction est exacte sans erreur de flottant : 3 réseaux à 0.1 kgCO2e/kWh', () => {
    expect(reduction('1', [network('0.1', '0.1'), network('0.2', '0.1'), network('0.3', '0.1')])).toBe(
      '0.06',
    )
  })

  it('la réduction est proportionnelle au pourcentage : f(p) = p × f(1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 1, max: 1_000_000 }), (percent, mwh) => {
        const networks = [network(String(mwh), '0.0854')]
        const atFull = quantity<'TonnesCo2ePerYear'>(reduction('1', networks))
        const atPercent = reduction(String(percent / 100), networks)
        expect(atFull.times(percent).dividedBy(100).toFixed()).toBe(atPercent)
      }),
    )
  })
})
