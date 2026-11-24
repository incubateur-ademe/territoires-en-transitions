import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateResidentielSobrieteReduction,
  type SobrietyFractions,
} from './calculate-residentiel-sobriete-reduction.ts'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'

type VectorsInMwh = Partial<Record<keyof ResidentialConsumption, string>>

function consumptionOf({
  electricity = '0',
  naturalGas = '0',
  fuelOil = '0',
  liquefiedPetroleumGas = '0',
  heat = '0',
}: VectorsInMwh): ResidentialConsumption {
  return {
    electricity: quantity<'MegawattHours'>(electricity),
    naturalGas: quantity<'MegawattHours'>(naturalGas),
    fuelOil: quantity<'MegawattHours'>(fuelOil),
    liquefiedPetroleumGas: quantity<'MegawattHours'>(liquefiedPetroleumGas),
    heat: quantity<'MegawattHours'>(heat),
  }
}

function fractionsOf(households: string, consumptionReduction: string): SobrietyFractions {
  return {
    households: quantity<'Fraction'>(households),
    consumptionReduction: quantity<'Fraction'>(consumptionReduction),
  }
}

const FULL = fractionsOf('1', '1')

function reduction({
  vectors,
  sobrietyFractions = FULL,
  heatEmissionFactor = '0',
}: {
  vectors: VectorsInMwh
  sobrietyFractions?: SobrietyFractions
  heatEmissionFactor?: string
}): string {
  return calculateResidentielSobrieteReduction({
    sobrietyFractions,
    consumption: consumptionOf(vectors),
    heatEmissionFactor: quantity<'KgCo2ePerKwh'>(heatEmissionFactor),
  }).toFixed()
}

describe('calculateResidentielSobrieteReduction', () => {
  it.each([
    ['1 000 MWh d’électricité : 0,0519 × 67,4 % kgCO2e/kWh', { electricity: '1000' }, '34.9806'],
    ['1 000 MWh de gaz naturel : 55,88 kg/GJ × 0,0036', { naturalGas: '1000' }, '201.168'],
    ['1 000 MWh de fioul : 74,52 kg/GJ × 0,0036', { fuelOil: '1000' }, '268.272'],
    ['1 000 MWh de GPL : 63,1 kg/GJ × 0,0036', { liquefiedPetroleumGas: '1000' }, '227.16'],
  ])('à 100 %% des foyers et 100 %% de baisse, %s évitent le résultat attendu', (_label, vectors, expected) => {
    expect(reduction({ vectors })).toBe(expected)
  })

  it('1 000 MWh de chaleur à 0,1 kgCO2e/kWh évitent 100 tCO2e', () => {
    expect(reduction({ vectors: { heat: '1000' }, heatEmissionFactor: '0.1' })).toBe('100')
  })

  it('additionne les cinq vecteurs : 1 000 MWh de chacun évitent 831,5806 tCO2e', () => {
    const vectors = {
      electricity: '1000',
      naturalGas: '1000',
      fuelOil: '1000',
      liquefiedPetroleumGas: '1000',
      heat: '1000',
    }
    expect(reduction({ vectors, heatEmissionFactor: '0.1' })).toBe('831.5806')
  })

  it('applique la part des foyers puis la baisse : 50 % des foyers × 10 % de baisse = 5 % de 831,5806', () => {
    const vectors = {
      electricity: '1000',
      naturalGas: '1000',
      fuelOil: '1000',
      liquefiedPetroleumGas: '1000',
      heat: '1000',
    }
    expect(
      reduction({
        vectors,
        sobrietyFractions: fractionsOf('0.5', '0.1'),
        heatEmissionFactor: '0.1',
      }),
    ).toBe('41.57903')
  })

  it.each([
    ['aucun foyer', fractionsOf('0', '0.5')],
    ['aucune baisse', fractionsOf('0.5', '0')],
  ])('ne réduit rien avec %s', (_label, sobrietyFractions) => {
    expect(reduction({ vectors: { electricity: '1000' }, sobrietyFractions })).toBe('0')
  })

  it('ne réduit rien sans consommation', () => {
    expect(reduction({ vectors: {} })).toBe('0')
  })
})
