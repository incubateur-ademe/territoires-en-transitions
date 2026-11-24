import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import type { AgriculturalConsumption } from './data/agricultural-consumption.ts'
import {
  calculateBatimentsMachinesAgricolesReduction,
  type ReductionFractions,
} from './calculate-batiments-machines-agricoles-reduction.ts'

const ONE_THOUSAND_MWH = quantity<'MegawattHours'>('1000')

const ZERO_MWH = quantity<'MegawattHours'>('0')

const NO_CONSUMPTION: AgriculturalConsumption = {
  electricity: ZERO_MWH,
  naturalGas: ZERO_MWH,
  petroleumProducts: ZERO_MWH,
  heat: ZERO_MWH,
}

const FULL_REDUCTION: ReductionFractions = {
  electricity: quantity<'Fraction'>('1'),
  naturalGas: quantity<'Fraction'>('1'),
  petroleumProducts: quantity<'Fraction'>('1'),
  heat: quantity<'Fraction'>('1'),
}

function reduction({
  consumption,
  reductionFractions = FULL_REDUCTION,
  heatEmissionFactor = '0.1',
}: {
  consumption: Partial<AgriculturalConsumption>
  reductionFractions?: ReductionFractions
  heatEmissionFactor?: string
}): string {
  return calculateBatimentsMachinesAgricolesReduction({
    reductionFractions,
    consumption: { ...NO_CONSUMPTION, ...consumption },
    heatEmissionFactor: quantity<'KgCo2ePerKwh'>(heatEmissionFactor),
  }).toFixed()
}

describe('calculateBatimentsMachinesAgricolesReduction', () => {
  it('1000 MWh d’électricité évitent 34,9806 tCO2e : 0,0519 × 67,4 % kgCO2e/kWh', () => {
    expect(reduction({ consumption: { electricity: ONE_THOUSAND_MWH } })).toBe('34.9806')
  })

  it('1000 MWh de gaz naturel évitent 201,168 tCO2e : 55,88 kg/GJ × 0,0036 GJ/kWh', () => {
    expect(reduction({ consumption: { naturalGas: ONE_THOUSAND_MWH } })).toBe('201.168')
  })

  it('1000 MWh de produits pétroliers évitent 268,272 tCO2e : 74,52 kg/GJ × 0,0036 GJ/kWh', () => {
    expect(reduction({ consumption: { petroleumProducts: ONE_THOUSAND_MWH } })).toBe('268.272')
  })

  it('1000 MWh de chaleur à 0,1 kgCO2e/kWh évitent 100 tCO2e', () => {
    expect(reduction({ consumption: { heat: ONE_THOUSAND_MWH } })).toBe('100')
  })

  it('additionne les quatre vecteurs', () => {
    const consumption: AgriculturalConsumption = {
      electricity: ONE_THOUSAND_MWH,
      naturalGas: ONE_THOUSAND_MWH,
      petroleumProducts: ONE_THOUSAND_MWH,
      heat: ONE_THOUSAND_MWH,
    }
    expect(reduction({ consumption })).toBe('604.4206')
  })

  it('applique le pourcentage de chaque vecteur à ce vecteur seul', () => {
    const consumption: AgriculturalConsumption = {
      electricity: ONE_THOUSAND_MWH,
      naturalGas: ONE_THOUSAND_MWH,
      petroleumProducts: ONE_THOUSAND_MWH,
      heat: ONE_THOUSAND_MWH,
    }
    const reductionFractions: ReductionFractions = {
      electricity: quantity<'Fraction'>('0'),
      naturalGas: quantity<'Fraction'>('0'),
      petroleumProducts: quantity<'Fraction'>('0.5'),
      heat: quantity<'Fraction'>('0'),
    }
    expect(reduction({ consumption, reductionFractions })).toBe('134.136')
  })

  it('une chaleur à facteur nul n’évite rien', () => {
    expect(reduction({ consumption: { heat: ONE_THOUSAND_MWH }, heatEmissionFactor: '0' })).toBe('0')
  })

  it('sans consommation, rien n’est évité', () => {
    expect(reduction({ consumption: {} })).toBe('0')
  })

  it('la réduction est proportionnelle au pourcentage de produits pétroliers : f(p) = p × f(1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), fc.integer({ min: 1, max: 1_000_000 }), (percent, mwh) => {
        const consumption = { petroleumProducts: quantity<'MegawattHours'>(String(mwh)) }
        const reductionFractions: ReductionFractions = {
          ...FULL_REDUCTION,
          petroleumProducts: quantity<'Fraction'>((percent / 100).toFixed(2)),
        }
        const partial = reduction({ consumption, reductionFractions })
        const full = reduction({ consumption })
        expect(Number(partial)).toBeCloseTo((percent / 100) * Number(full), 6)
      }),
    )
  })
})
