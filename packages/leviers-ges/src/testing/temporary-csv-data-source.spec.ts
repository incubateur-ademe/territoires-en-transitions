import { describe, expect, it } from 'vitest'
import { territoryCodeSchema } from '../domain/territory.ts'
import { createTemporaryCsvDataSource } from './temporary-csv-data-source.ts'

const dataSource = createTemporaryCsvDataSource({
  'demo/values': {
    keyColumn: 'code',
    level: 'region',
    rows: [
      { code: '11', value: '1.5' },
      { code: '24', value: '2' },
    ],
  },
  'demo/constants': {
    keyColumn: 'name',
    rows: [{ name: 'FACTOR', value: '0.25' }],
  },
  'other/values': {
    keyColumn: 'code',
    level: 'departement',
    rows: [{ code: '75', value: '9' }],
  },
})

describe('createTemporaryCsvDataSource', () => {
  it('lit la ligne d’un territoire par le vrai chargeur CSV', () => {
    const territory = { level: 'region', code: territoryCodeSchema.parse('24') } as const
    expect(dataSource.row('demo/values', territory)._unsafeUnwrap()).toEqual({
      code: '24',
      value: '2',
    })
  })

  it('lit toutes les lignes d’un jeu', () => {
    expect(dataSource.rows('demo/values')._unsafeUnwrap()).toEqual([
      { code: '11', value: '1.5' },
      { code: '24', value: '2' },
    ])
  })

  it('lit une constante', () => {
    expect(dataSource.constant('demo/constants', 'FACTOR')._unsafeUnwrap()).toBe('0.25')
  })

  it('range deux dossiers côte à côte', () => {
    const territory = { level: 'departement', code: territoryCodeSchema.parse('75') } as const
    expect(dataSource.row('other/values', territory)._unsafeUnwrap()).toEqual({
      code: '75',
      value: '9',
    })
  })

  it('refuse un territoire d’un autre niveau que celui du jeu', () => {
    const territory = { level: 'epci', code: territoryCodeSchema.parse('24') } as const
    expect(dataSource.row('demo/values', territory)._unsafeUnwrapErr()).toMatchObject({
      reason: 'level_mismatch',
    })
  })

  it('refuse un jeu sans ligne', () => {
    expect(() => createTemporaryCsvDataSource({ 'demo/empty': { keyColumn: 'code', rows: [] } })).toThrow(
      'a fixture dataset needs at least one row',
    )
  })

  it('refuse une cellule qui obligerait à protéger le CSV', () => {
    expect(() =>
      createTemporaryCsvDataSource({
        'demo/quoted': { keyColumn: 'code', rows: [{ code: 'a,b' }] },
      }),
    ).toThrow('cell a,b needs CSV quoting')
  })
})
