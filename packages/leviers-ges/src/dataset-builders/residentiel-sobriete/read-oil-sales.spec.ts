import { describe, expect, it } from 'vitest'
import { readOilSales } from './read-oil-sales.ts'

const HEADER = '"DEPARTEMENT_CODE";"DEPARTEMENT_LIBELLE";"REGION_CODE";"ANNEE";"FOD";"GPL"'

function toSalesCsv(...lines: string[]): string {
  return [HEADER, ...lines].join('\n')
}

describe('readOilSales', () => {
  it('garde les ventes de 2024 d’un fichier à guillemets et à point-virgule', () => {
    const sales = readOilSales(
      toSalesCsv('"01";"Ain";"84";"2023";10;20', '"01";"Ain";"84";"2024";37676.86;17729.81396'),
    )._unsafeUnwrap()
    expect(sales).toEqual([
      { departementCode: '01', regionCode: '84', fuelOil: '37676.86', liquefiedPetroleumGas: '17729.81396' },
    ])
  })

  it('arrondit une vente à 12 décimales', () => {
    const sales = readOilSales(toSalesCsv('"2A";"Corse-du-Sud";"94";"2024";1.0000000000005;2'))._unsafeUnwrap()
    expect(sales[0]).toMatchObject({ fuelOil: '1.000000000001', liquefiedPetroleumGas: '2' })
  })

  it('ne lit pas les ventes d’une autre année, même sans valeur', () => {
    expect(readOilSales(toSalesCsv('"01";"Ain";"84";"2005";;'))._unsafeUnwrap()).toEqual([])
  })

  it('refuse une vente de 2024 sans valeur', () => {
    expect(readOilSales(toSalesCsv('"01";"Ain";"84";"2024";;5'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
      detail: 'FOD= is not a decimal number',
    })
  })

  it('refuse un fichier sans colonne GPL', () => {
    const csv = '"DEPARTEMENT_CODE";"REGION_CODE";"ANNEE";"FOD"\n"01";"84";"2024";5'
    expect(readOilSales(csv)._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'GPL',
    })
  })

  it('refuse un fichier sans colonne ANNEE', () => {
    expect(readOilSales('"DEPARTEMENT_CODE"\n"01"')._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'ANNEE',
    })
  })

  it('refuse un CSV mal formé', () => {
    expect(readOilSales('a;a\n1;2')._unsafeUnwrapErr()).toMatchObject({ reason: 'malformed_csv' })
  })
})
