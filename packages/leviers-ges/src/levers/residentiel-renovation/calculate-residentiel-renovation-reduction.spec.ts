import { describe, expect, it } from 'vitest'
import type { ResidentialConsumption } from '../../domain/residential-consumption.ts'
import type { ResidentialEnergyVector } from '../../domain/residential-heating-shares.ts'
import { quantity } from '../../domain/units.ts'
import { calculateResidentielRenovationReduction } from './calculate-residentiel-renovation-reduction.ts'

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

function sharesOf(
  shares: Partial<Record<ResidentialEnergyVector, string>>,
): Readonly<Record<ResidentialEnergyVector, ReturnType<typeof quantity<'Fraction'>>>> {
  return {
    electricity: quantity<'Fraction'>(shares.electricity ?? '1'),
    naturalGas: quantity<'Fraction'>(shares.naturalGas ?? '1'),
    fuelOil: quantity<'Fraction'>(shares.fuelOil ?? '1'),
    liquefiedPetroleumGas: quantity<'Fraction'>(shares.liquefiedPetroleumGas ?? '1'),
    heat: quantity<'Fraction'>(shares.heat ?? '1'),
  }
}

function reduction({
  vectors,
  eligible = {},
  renovated = '1',
  heatEmissionFactor = '0',
}: {
  vectors: VectorsInMwh
  eligible?: Partial<Record<ResidentialEnergyVector, string>>
  renovated?: string
  heatEmissionFactor?: string
}): string {
  return calculateResidentielRenovationReduction({
    renovatedParcFraction: quantity<'Fraction'>(renovated),
    consumption: consumptionOf(vectors),
    eligibleSurfaceShare: sharesOf(eligible),
    heatEmissionFactor: quantity<'KgCo2ePerKwh'>(heatEmissionFactor),
  })
    .decimalPlaces(2)
    .toFixed()
}

describe('calculateResidentielRenovationReduction', () => {
  it.each([
    ['1 000 MWh d’électricité : 46,7 % de chauffage et d’ECS × 35 % × FE 0,0349806', { electricity: '1000' }, '5.72'],
    ['1 000 MWh de gaz naturel : 92,6 %', { naturalGas: '1000' }, '65.2'],
    ['1 000 MWh de fioul : 100 %', { fuelOil: '1000' }, '93.9'],
    ['1 000 MWh de GPL : 53,2 %', { liquefiedPetroleumGas: '1000' }, '42.3'],
  ])('à 100 %% du parc rénové et tout éligible, %s', (_label, vectors, expected) => {
    expect(reduction({ vectors })).toBe(expected)
  })

  it('1 000 MWh de chaleur à 0,1 kgCO2e/kWh : 100 % de chauffage et d’ECS × 35 % = 35 tCO2e', () => {
    expect(reduction({ vectors: { heat: '1000' }, heatEmissionFactor: '0.1' })).toBe('35')
  })

  it('applique la part éligible de chaque vecteur et la moitié du parc rénové : 61,54 tCO2e', () => {
    expect(
      reduction({
        vectors: {
          electricity: '1000',
          naturalGas: '1000',
          fuelOil: '1000',
          liquefiedPetroleumGas: '1000',
          heat: '1000',
        },
        eligible: {
          electricity: '0.5',
          naturalGas: '0.5',
          fuelOil: '0.2',
          liquefiedPetroleumGas: '0.8',
          heat: '1',
        },
        renovated: '0.5',
        heatEmissionFactor: '0.1',
      }),
    ).toBe('61.54')
  })

  it('ne rénove rien à 0 % du parc ni sans surface éligible', () => {
    const vectors = { naturalGas: '1000', fuelOil: '1000' }
    expect({
      none: reduction({ vectors, renovated: '0' }),
      noEligibleSurface: reduction({
        vectors,
        eligible: { naturalGas: '0', fuelOil: '0' },
      }),
    }).toEqual({ none: '0', noEligibleSurface: '0' })
  })
})
