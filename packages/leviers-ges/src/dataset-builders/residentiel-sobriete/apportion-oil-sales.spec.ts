import { describe, expect, it } from 'vitest'
import { toBig } from '../../domain/big-number.ts'
import { apportionOilSales, type RegionalPetroleumMwh } from './apportion-oil-sales.ts'
import type { OilSales } from './read-oil-sales.ts'

function toSale({
  departementCode,
  regionCode = '84',
  fuelOil,
  liquefiedPetroleumGas,
}: {
  departementCode: string
  regionCode?: string
  fuelOil: string
  liquefiedPetroleumGas: string
}): OilSales {
  return { departementCode, regionCode, fuelOil, liquefiedPetroleumGas }
}

function toRegional(fuelOilMwh: string, liquefiedPetroleumGasMwh: string): RegionalPetroleumMwh {
  return { fuelOilMwh: toBig(fuelOilMwh), liquefiedPetroleumGasMwh: toBig(liquefiedPetroleumGasMwh) }
}

describe('apportionOilSales', () => {
  it('répartit le fioul et le GPL de la région au prorata des ventes de chaque département', () => {
    const departments = apportionOilSales({
      sales: [
        toSale({ departementCode: '01', fuelOil: '1', liquefiedPetroleumGas: '3' }),
        toSale({ departementCode: '07', fuelOil: '3', liquefiedPetroleumGas: '1' }),
      ],
      regionalPetroleum: new Map([['84', toRegional('1000', '400')]]),
    })._unsafeUnwrap()
    expect(departments).toEqual([
      { departementCode: '01', fuelOilMwh: '250', liquefiedPetroleumGasMwh: '300' },
      { departementCode: '07', fuelOilMwh: '750', liquefiedPetroleumGasMwh: '100' },
    ])
  })

  it('répartit chaque région sur ses seuls départements', () => {
    const departments = apportionOilSales({
      sales: [
        toSale({ departementCode: '01', fuelOil: '5', liquefiedPetroleumGas: '5' }),
        toSale({ departementCode: '29', regionCode: '53', fuelOil: '7', liquefiedPetroleumGas: '7' }),
      ],
      regionalPetroleum: new Map([
        ['84', toRegional('100', '10')],
        ['53', toRegional('200', '20')],
      ]),
    })._unsafeUnwrap()
    expect(departments.map(({ fuelOilMwh }) => fuelOilMwh)).toEqual(['100', '200'])
  })

  it('arrondit à 12 décimales', () => {
    const departments = apportionOilSales({
      sales: [
        toSale({ departementCode: '01', fuelOil: '1', liquefiedPetroleumGas: '1' }),
        toSale({ departementCode: '07', fuelOil: '2', liquefiedPetroleumGas: '2' }),
      ],
      regionalPetroleum: new Map([['84', toRegional('1', '1')]]),
    })._unsafeUnwrap()
    expect(departments[0]).toMatchObject({
      fuelOilMwh: '0.333333333333',
      liquefiedPetroleumGasMwh: '0.333333333333',
    })
  })

  it('refuse un département dont la région n’a pas de consommation', () => {
    expect(
      apportionOilSales({
        sales: [toSale({ departementCode: '01', fuelOil: '1', liquefiedPetroleumGas: '1' })],
        regionalPetroleum: new Map(),
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-sobriete/departements.csv',
      reason: 'missing_key_column',
      detail: 'region 84',
    })
  })

  it('refuse une région du bilan sans aucune vente', () => {
    expect(
      apportionOilSales({
        sales: [toSale({ departementCode: '01', fuelOil: '1', liquefiedPetroleumGas: '1' })],
        regionalPetroleum: new Map([
          ['84', toRegional('1', '1')],
          ['11', toRegional('1', '1')],
        ]),
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-sobriete/departements.csv',
      reason: 'empty_dataset',
      detail: 'no oil sales in region 11',
    })
  })

  it.each([
    ['du fioul', '0', '1'],
    ['du GPL', '1', '0'],
  ])('refuse une région sans aucune vente %s', (_label, fuelOil, liquefiedPetroleumGas) => {
    expect(
      apportionOilSales({
        sales: [toSale({ departementCode: '01', fuelOil, liquefiedPetroleumGas })],
        regionalPetroleum: new Map([['84', toRegional('1', '1')]]),
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'residentiel-sobriete/departements.csv',
      reason: 'empty_dataset',
      detail: 'no oil sales in region 84',
    })
  })
})
