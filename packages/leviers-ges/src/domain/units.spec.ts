import { describe, expect, expectTypeOf, it } from 'vitest'
import {
  gigawattHoursToMegawattHours,
  parseFraction,
  quantity,
  type Fraction,
  type Kilometres,
  type Tonnes,
} from './units.ts'

describe('units', () => {
  it('une quantité d’une autre unité ne s’assigne pas à des kilomètres', () => {
    expectTypeOf<Tonnes>().not.toExtend<Kilometres>()
    expectTypeOf<Fraction>().not.toExtend<Kilometres>()
    expectTypeOf<Kilometres>().toExtend<Kilometres>()
  })

  it.each([
    ['1', '1000'],
    ['0.0015', '1.5'],
    ['0', '0'],
  ])('%s GWh valent %s MWh', (gigawattHours, megawattHours) => {
    const converted = gigawattHoursToMegawattHours(quantity<'GigawattHours'>(gigawattHours))
    expect(converted.toFixed()).toBe(megawattHours)
  })

  it.each(['0', '0.25', '1'])('accepte la fraction %s', (value) => {
    expect(parseFraction(value).isOk()).toBe(true)
  })

  it.each(['-0.01', '1.01', '25', 'abc'])('refuse la fraction %s', (value) => {
    expect(parseFraction(value)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_parameter',
      parameter: 'fraction',
      value,
    })
  })
})
