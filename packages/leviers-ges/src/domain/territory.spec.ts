import { describe, expect, it } from 'vitest'
import { levels, territoryCodeSchema } from './territory.ts'

describe('territory', () => {
  it('compte trois niveaux', () => {
    expect([...levels]).toEqual(['departement', 'epci', 'region'])
  })

  it.each(['11', '2A', '200054781'])('accepte le code %s', (code) => {
    expect(territoryCodeSchema.parse(code)).toBe(code)
  })

  it.each([
    [' 11 ', '11'],
    ['\t2A\n', '2A'],
  ])('retire les espaces autour du code %j', (code, expected) => {
    expect(territoryCodeSchema.parse(code)).toBe(expected)
  })

  it.each(['', '  '])('refuse le code vide %j', (code) => {
    const result = territoryCodeSchema.safeParse(code)
    expect(result.success).toBe(false)
    expect(result.error?.issues).toMatchObject([{ message: 'must not be empty' }])
  })
})
