import { describe, expect, it } from 'vitest'
import { readDepartmentConsumption } from './read-department-consumption.ts'

const dataset = 'jeu-de-test'

describe('readDepartmentConsumption', () => {
  it('indexe la consommation hors secret de chaque département', () => {
    const csv = [
      'code_departement,conso_mwh_hors_secret,lignes_avec_valeur,lignes_secret',
      '01,1704359.628,450,7',
      '2A,500529.1590000000005,152,0',
    ].join('\n')
    expect(readDepartmentConsumption({ dataset, csv })._unsafeUnwrap()).toEqual(
      new Map([
        ['01', '1704359.628'],
        ['2A', '500529.159000000001'],
      ]),
    )
  })

  it('refuse un fichier sans colonne de consommation', () => {
    expect(
      readDepartmentConsumption({ dataset, csv: 'code_departement\n01' })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset,
      reason: 'columns_mismatch',
      detail: 'conso_mwh_hors_secret',
    })
  })

  it('refuse un fichier sans colonne code_departement', () => {
    expect(
      readDepartmentConsumption({ dataset, csv: 'conso_mwh_hors_secret\n1' })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'code_departement' })
  })

  it('refuse une consommation qui n’est pas un nombre', () => {
    const csv = 'code_departement,conso_mwh_hors_secret\n01,secret'
    expect(readDepartmentConsumption({ dataset, csv })._unsafeUnwrapErr()).toMatchObject({
      reason: 'unreadable',
      detail: 'conso_mwh_hors_secret=secret is not a decimal number',
    })
  })

  it('refuse un CSV mal formé', () => {
    expect(readDepartmentConsumption({ dataset, csv: 'a,a\n1,2' })._unsafeUnwrapErr()).toMatchObject({
      dataset,
      reason: 'malformed_csv',
    })
  })
})
