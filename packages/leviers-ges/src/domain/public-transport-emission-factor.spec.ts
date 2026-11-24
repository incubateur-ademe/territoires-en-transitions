import { describe, expect, it } from 'vitest'
import { calculatePublicTransportEmissionFactor } from './public-transport-emission-factor.ts'
import { quantity } from './units.ts'

describe('calculatePublicTransportEmissionFactor', () => {
  it('pondère le ferré et le bus par la part du ferré : 60 % à 0,02 et 40 % à 0,08 donnent 0,044', () => {
    expect(
      calculatePublicTransportEmissionFactor({
        busEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>('0.8'),
        railShare: quantity<'Fraction'>('0.6'),
        railEmissionFactor: quantity<'KgCo2ePerPassengerKilometre'>('0.02'),
      }).toFixed(),
    ).toBe('0.044')
  })
})
