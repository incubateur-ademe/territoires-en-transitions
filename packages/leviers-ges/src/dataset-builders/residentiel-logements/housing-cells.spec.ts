import { describe, expect, it } from 'vitest'
import {
  HEATING_VECTOR_BY_FUEL_CODE,
  HOUSING_COLUMNS,
  SURFACE_SQUARE_METRES_BY_CLASS,
  toConstructionPeriod,
  toHousingColumn,
  toHousingType,
} from './housing-cells.ts'

describe('housing-cells', () => {
  it('compte 54 colonnes distinctes : 3 types, 6 combustibles, 3 périodes', () => {
    expect({ count: HOUSING_COLUMNS.length, distinct: new Set(HOUSING_COLUMNS).size }).toEqual({
      count: 54,
      distinct: 54,
    })
  })

  it('nomme une colonne par type, combustible et période', () => {
    expect(
      toHousingColumn({ type: 'social_apartment', vector: 'natural_gas', period: '1971_to_2005' }),
    ).toBe('housing_m2_social_apartment_natural_gas_1971_to_2005')
  })

  it('associe les six combustibles de l’INSEE, sans bois', () => {
    expect(Object.values(HEATING_VECTOR_BY_FUEL_CODE)).toEqual([
      'heat_network',
      'natural_gas',
      'fuel_oil',
      'electricity',
      'lpg',
      'other',
    ])
  })

  it('prend le milieu de chaque classe de superficie', () => {
    expect(Object.values(SURFACE_SQUARE_METRES_BY_CLASS)).toEqual([
      '20',
      '35',
      '50',
      '70',
      '90',
      '110',
      '130',
    ])
  })

  it.each([
    ['1', 'Z', 'house'],
    ['1', '1', 'house'],
    ['2', '1', 'social_apartment'],
    ['2', '2', 'private_apartment'],
    ['2', 'Y', undefined],
    ['3', '2', undefined],
  ])('type de logement : TYPL %s et HLML %s donnent %s', (typeCode, landlordCode, expected) => {
    expect(toHousingType({ typeCode, landlordCode })).toBe(expected)
  })

  it.each([
    ['A11', 'before_1971'],
    ['A12', 'before_1971'],
    ['B11', 'before_1971'],
    ['B12', '1971_to_2005'],
    ['C100', '1971_to_2005'],
    ['C106', 'after_2005'],
    ['C2019', 'after_2005'],
    ['ZZZ', undefined],
  ])('période : ACHL %s donne %s', (code, expected) => {
    expect(toConstructionPeriod(code)).toBe(expected)
  })
})
