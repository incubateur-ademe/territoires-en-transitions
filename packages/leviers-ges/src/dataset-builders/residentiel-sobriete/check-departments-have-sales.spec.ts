import { describe, expect, it } from 'vitest'
import { checkDepartmentsHaveSales } from './check-departments-have-sales.ts'
import type { OilSales } from './read-oil-sales.ts'

function toSale(departementCode: string): OilSales {
  return { departementCode, regionCode: '84', fuelOil: '1', liquefiedPetroleumGas: '1' }
}

describe('checkDepartmentsHaveSales', () => {
  it('accepte des départements qui ont tous des ventes', () => {
    const consumptionByDepartment = new Map([['01', '1'], ['07', '2']])
    expect(
      checkDepartmentsHaveSales({
        consumptionByDepartment,
        sales: [toSale('01'), toSale('07'), toSale('26')],
      }).isOk(),
    ).toBe(true)
  })

  it.each(['971', '972', '973', '974', '976'])(
    'accepte le département d’outre-mer %s, absent des ventes',
    (departementCode) => {
      const consumptionByDepartment = new Map([['01', '1'], [departementCode, '2']])
      expect(
        checkDepartmentsHaveSales({ consumptionByDepartment, sales: [toSale('01')] }).isOk(),
      ).toBe(true)
    },
  )

  it.each(['33', '2A', '97', '9710'])(
    'refuse le département %s, absent des ventes et hors outre-mer',
    (departementCode) => {
      const consumptionByDepartment = new Map([[departementCode, '2']])
      expect(
        checkDepartmentsHaveSales({ consumptionByDepartment, sales: [toSale('01')] })._unsafeUnwrapErr(),
      ).toEqual({
        kind: 'invalid_dataset',
        dataset: 'residentiel-sobriete/departements.csv',
        reason: 'missing_key_column',
        detail: `department ${departementCode} has consumption but no oil sales`,
      })
    },
  )
})
