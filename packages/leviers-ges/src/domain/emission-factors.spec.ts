import { describe, expect, it } from 'vitest'
import {
  convertToKgPerKwh,
  ELECTRIC_BUS_EMISSION_FACTOR,
  ELECTRIC_CAR_EMISSION_FACTOR,
  ELECTRICITY_APPLIED_EMISSION_FACTOR,
  NATURAL_GAS_EMISSION_FACTOR,
} from './emission-factors.ts'
import { quantity } from './units.ts'

describe('emission-factors', () => {
  it('la voiture électrique vaut 0,013345 kgCO2e/véh.km et le bus électrique 0,095', () => {
    expect({
      car: ELECTRIC_CAR_EMISSION_FACTOR.toFixed(),
      bus: ELECTRIC_BUS_EMISSION_FACTOR.toFixed(),
    }).toEqual({ car: '0.013345', bus: '0.095' })
  })

  it('l’électricité vaut le mix moyen 2024 × 67,4 % = 0,0519 × 0,674 = 0,0349806 kgCO2e/kWh', () => {
    expect(ELECTRICITY_APPLIED_EMISSION_FACTOR.toFixed()).toBe('0.0349806')
  })

  it('le gaz naturel vaut 55,88 kg/GJ × 0,0036 = 0,201168 kgCO2e/kWh', () => {
    expect(convertToKgPerKwh(NATURAL_GAS_EMISSION_FACTOR).toFixed()).toBe('0.201168')
  })

  it.each([
    ['74.52', '0.268272'],
    ['63.1', '0.22716'],
    ['78', '0.2808'],
    ['0', '0'],
  ])('convertit %s kg/GJ en %s kg/kWh', (kgPerGigajoule, expected) => {
    expect(convertToKgPerKwh(quantity<'KgCo2ePerGigajoule'>(kgPerGigajoule)).toFixed()).toBe(expected)
  })
})
