import { describe, expect, it } from 'vitest'
import { toCityCode } from './to-city-code.ts'

describe('toCityCode', () => {
  it.each([
    ['75101', '75056'],
    ['75120', '75056'],
    ['69381', '69123'],
    ['69389', '69123'],
    ['13201', '13055'],
    ['13216', '13055'],
    ['75056', '75056'],
    ['75100', '75100'],
    ['75121', '75121'],
    ['69380', '69380'],
    ['69390', '69390'],
    ['13200', '13200'],
    ['13217', '13217'],
    ['2A004', '2A004'],
    ['7511', '7511'],
    ['751010', '751010'],
    ['075101', '075101'],
  ])('rattache la commune %s à %s', (communeCode, expected) => {
    expect(toCityCode(communeCode)).toBe(expected)
  })
})
