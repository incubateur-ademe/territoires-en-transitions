import { describe, expect, it } from 'vitest'
import { quantity } from '../../../domain/units.ts'
import type { AgriculturalConsumption } from './agricultural-consumption.ts'
import {
  calculateApportionedRegionalEnergy,
  type RegionalPart,
} from './calculate-apportioned-regional-energy.ts'

function part(share: string, petroleumProducts: string, heat: string): RegionalPart {
  const zero = quantity<'MegawattHours'>('0')
  const regionalConsumption: AgriculturalConsumption = {
    electricity: zero,
    naturalGas: zero,
    petroleumProducts: quantity<'MegawattHours'>(petroleumProducts),
    heat: quantity<'MegawattHours'>(heat),
  }
  return { share: quantity<'Fraction'>(share), regionalConsumption }
}

function apportioned(parts: readonly RegionalPart[]): Record<string, string> {
  const { petroleumProducts, heat } = calculateApportionedRegionalEnergy(parts)
  return { petroleumProducts: petroleumProducts.toFixed(), heat: heat.toFixed() }
}

describe('calculateApportionedRegionalEnergy', () => {
  it('prend la part de chaque région : 25 % de 1000 et 50 % de 2000 font 1250 MWh de produits pétroliers', () => {
    expect(apportioned([part('0.25', '1000', '400'), part('0.5', '2000', '0')])).toEqual({
      petroleumProducts: '1250',
      heat: '100',
    })
  })

  it('une part de 100 % rend la région entière', () => {
    expect(apportioned([part('1', '43923.6', '343.5')])).toEqual({
      petroleumProducts: '43923.6',
      heat: '343.5',
    })
  })

  it('sans région, rien n’est réparti', () => {
    expect(apportioned([])).toEqual({ petroleumProducts: '0', heat: '0' })
  })
})
