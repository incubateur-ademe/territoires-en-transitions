import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  numberToDecimalText,
  parseBig,
  parseBigWithExponent,
  roundOutput,
  sum,
  toBig,
} from './big-number.ts'

describe('big-number', () => {
  it('0.1 + 0.2 vaut exactement 0.3', () => {
    expect(toBig('0.1').plus(toBig('0.2')).isEqualTo(toBig('0.3'))).toBe(true)
  })

  it('une somme de 10000 valeurs 0.1 vaut exactement 1000', () => {
    const values = Array.from({ length: 10_000 }, () => toBig('0.1'))
    expect(sum(values).toFixed()).toBe('1000')
  })

  it('la somme de n valeurs 0.1 vaut exactement n / 10', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 5_000 }), (count) => {
        const values = Array.from({ length: count }, () => toBig('0.1'))
        expect(sum(values).isEqualTo(toBig(String(count)).dividedBy(10))).toBe(true)
      }),
    )
  })

  it('refuse une chaîne qui n’est pas un nombre', () => {
    expect(() => toBig('abc')).toThrow()
    expect(parseBig('abc')._unsafeUnwrapErr()).toBe('not_a_number')
  })

  it.each(['0x1F', '1e3', ' 1.5', '+1.5', 'NaN', 'Infinity', '1_0', '.5', ''])(
    'parseBig refuse l’écriture non décimale %j',
    (value) => {
      expect(parseBig(value)._unsafeUnwrapErr()).toBe('not_a_number')
    },
  )

  it.each(['0', '-1', '1.5', '56.25'])('parseBig accepte %s', (value) => {
    expect(parseBig(value)._unsafeUnwrap().toFixed()).toBe(value)
  })

  it.each([
    ['1e3', '1000'],
    ['5.8370206071839403E-2', '0.058370206071839403'],
    ['2.5E+2', '250'],
    ['-1e-2', '-0.01'],
    ['56.25', '56.25'],
  ])('parseBigWithExponent accepte %s, soit %s', (value, expected) => {
    expect(parseBigWithExponent(value)._unsafeUnwrap().toFixed()).toBe(expected)
  })

  it.each(['0x1F', ' 1.5', '+1.5', 'NaN', 'Infinity', '1_0', '.5', '', '1e', 'e3', '1e+'])(
    'parseBigWithExponent refuse %j',
    (value) => {
      expect(parseBigWithExponent(value)._unsafeUnwrapErr()).toBe('not_a_number')
    },
  )

  it.each([
    [1, '1'],
    [0.1, '0.1'],
    [-2.5, '-2.5'],
    [1e21, '1000000000000000000000'],
    [5e-7, '0.0000005'],
  ])('numberToDecimalText écrit le nombre %s en décimal plein', (value, expected) => {
    expect(numberToDecimalText(value)).toBe(expected)
  })

  it('arrondit la sortie à 2 décimales, 1.165 donne 1.17', () => {
    expect(roundOutput(toBig('1.165')).toFixed()).toBe('1.17')
  })
})
