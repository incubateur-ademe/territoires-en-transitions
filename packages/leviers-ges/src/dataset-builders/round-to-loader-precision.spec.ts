import { describe, expect, it } from 'vitest'
import { roundToLoaderPrecision } from './round-to-loader-precision.ts'

function roundOf(text: string): string {
  return roundToLoaderPrecision({ dataset: 'demo', column: 'value', text })._unsafeUnwrap()
}

describe('roundToLoaderPrecision', () => {
  it.each([
    ['12', '12'],
    ['0.1000000000000', '0.1'],
    ['1.0000000000005', '1.000000000001'],
    ['1.0000000000004', '1'],
    ['-1.0000000000005', '-1.000000000001'],
    ['-0.0000000000001', '0'],
    ['-0', '0'],
  ])('arrondit %s à 12 décimales, soit %s', (text, expected) => {
    expect(roundOf(text)).toBe(expected)
  })

  it.each([
    ['5.8370206071839403E-2', '0.058370206072'],
    ['1e3', '1000'],
    ['2.5E+2', '250'],
    ['1E-13', '0'],
  ])('écrit la notation scientifique %s en décimal : %s', (text, expected) => {
    expect(roundOf(text)).toBe(expected)
  })

  it.each(['abc', '', ' 1', '1,5', '.5', '0x10', 'NaN', '1e'])(
    'refuse %j qui n’est pas un nombre décimal',
    (text) => {
      expect(
        roundToLoaderPrecision({ dataset: 'demo', column: 'value', text })._unsafeUnwrapErr(),
      ).toEqual({
        kind: 'invalid_dataset',
        dataset: 'demo',
        reason: 'unreadable',
        detail: `value=${text} is not a decimal number`,
      })
    },
  )
})
