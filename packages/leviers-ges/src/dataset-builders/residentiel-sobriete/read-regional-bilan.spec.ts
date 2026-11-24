import { describe, expect, it } from 'vitest'
import { readRegionalBilan } from './read-regional-bilan.ts'

const HEADER =
  'fichier,code,territoire,CR1_residentiel_gwh,CR2_produits_petroliers_gwh_pci,CR3_gaz_gwh_pcs,CR4_gaz_gwh_pci,CR5_electricite_gwh,CR7_enr_dechets_gwh,CR8_chaleur_commercialisee_gwh'

function toLine({
  code,
  petroleum = '100',
  gas = '200',
  electricity = '300',
  heat = '40',
}: {
  code: string
  petroleum?: string
  gas?: string
  electricity?: string
  heat?: string
}): string {
  return `f.xlsx,${code},Région,1,${petroleum},2,${gas},${electricity},3,${heat}`
}

function toBilanCsv(...lines: string[]): string {
  return [HEADER, ...lines].join('\n')
}

describe('readRegionalBilan', () => {
  it('garde les régions triées par code et écarte le total métropolitain et les territoires sans code', () => {
    const bilans = readRegionalBilan(
      toBilanCsv(
        toLine({ code: '84' }),
        toLine({ code: '10' }),
        toLine({ code: '' }),
        toLine({ code: '11', petroleum: '1', gas: '2', electricity: '3', heat: '4' }),
      ),
    )._unsafeUnwrap()
    expect(bilans).toEqual([
      {
        regionCode: '11',
        electricityGwh: '3',
        naturalGasGwh: '2',
        petroleumProductsGwh: '1',
        heatGwh: '4',
      },
      {
        regionCode: '84',
        electricityGwh: '300',
        naturalGasGwh: '200',
        petroleumProductsGwh: '100',
        heatGwh: '40',
      },
    ])
  })

  it('arrondit chaque consommation à 12 décimales', () => {
    const bilans = readRegionalBilan(
      toBilanCsv(
        toLine({
          code: '94',
          petroleum: '1.0000000000005',
          gas: '2.0000000000004',
          electricity: '3.1111111111111111',
          heat: '4',
        }),
      ),
    )._unsafeUnwrap()
    expect(bilans[0]).toMatchObject({
      petroleumProductsGwh: '1.000000000001',
      naturalGasGwh: '2',
      electricityGwh: '3.111111111111',
    })
  })

  it('refuse un fichier sans colonne de consommation attendue', () => {
    const csv = 'fichier,code\nf.xlsx,84'
    expect(readRegionalBilan(csv)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'columns_mismatch',
      detail: 'CR5_electricite_gwh',
    })
  })

  it('refuse un fichier sans colonne code', () => {
    expect(readRegionalBilan('fichier\nf.xlsx')._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'code',
    })
  })

  it('refuse une consommation qui n’est pas un nombre', () => {
    expect(
      readRegionalBilan(toBilanCsv(toLine({ code: '84', heat: 'secret' })))._unsafeUnwrapErr(),
    ).toMatchObject({
      reason: 'unreadable',
      detail: 'CR8_chaleur_commercialisee_gwh=secret is not a decimal number',
    })
  })

  it('refuse un CSV mal formé', () => {
    expect(readRegionalBilan('a,a\n1,2')._unsafeUnwrapErr()).toMatchObject({
      reason: 'malformed_csv',
    })
  })
})
