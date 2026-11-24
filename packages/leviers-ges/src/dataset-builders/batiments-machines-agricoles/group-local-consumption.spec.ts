import { describe, expect, it } from 'vitest'
import { groupLocalConsumption } from './group-local-consumption.ts'

function toCsv(...lines: string[]): string {
  return ['CODE;CONSO', ...lines].join('\n')
}

function sumOf(csv: string, toKey: (value: string) => string = (value) => value) {
  return groupLocalConsumption({ dataset: 'local', csv, keyColumn: 'CODE', toKey })
}

describe('groupLocalConsumption', () => {
  it('regroupe les consommations par clé, dans l’ordre du fichier', () => {
    const local = sumOf(toCsv('A;1.5', 'B;2', 'A;0.25'))._unsafeUnwrap()
    expect(
      [...local.consumptionsByKey].map(([key, amounts]) => [key, amounts.map((a) => a.toFixed())]),
    ).toEqual([
      ['A', ['1.5', '0.25']],
      ['B', ['2']],
    ])
  })

  it('ne compte pas les lignes sous secret statistique et les dénombre', () => {
    const local = sumOf(toCsv('A;1', 'A;secret', 'B;secret'))._unsafeUnwrap()
    expect({
      keys: [...local.consumptionsByKey.keys()],
      secretLineCount: local.secretLineCount,
    }).toEqual({ keys: ['A'], secretLineCount: 2 })
  })

  it('regroupe sous la clé calculée par toKey', () => {
    const local = sumOf(toCsv('751010101;1', '751020101;2', '690010101;4'), (value) =>
      value.slice(0, 2),
    )._unsafeUnwrap()
    expect([...local.consumptionsByKey.keys()]).toEqual(['75', '69'])
  })

  it('renvoie un jeu vide sans ligne', () => {
    const local = sumOf(toCsv())._unsafeUnwrap()
    expect({ keys: local.consumptionsByKey.size, secret: local.secretLineCount }).toEqual({
      keys: 0,
      secret: 0,
    })
  })

  it('refuse une consommation qui n’est pas un nombre', () => {
    expect(sumOf(toCsv('A;beaucoup'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'local',
      reason: 'unreadable',
      detail: 'CONSO=beaucoup is not a decimal number',
    })
  })

  it.each(['CODE', 'CONSO'])('refuse un fichier sans la colonne %s', (column) => {
    const header = ['CODE', 'CONSO'].filter((name) => name !== column).join(';')
    expect(sumOf(`${header}\nA`)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'local',
      reason: 'columns_mismatch',
      detail: column,
    })
  })

  it('refuse un fichier dont une ligne n’a pas le bon nombre de colonnes', () => {
    expect(sumOf(toCsv('A;1;en trop'))._unsafeUnwrapErr()).toMatchObject({
      dataset: 'local',
      reason: 'malformed_csv',
    })
  })
})
