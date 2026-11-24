import { describe, expect, it } from 'vitest'
import { toBig } from './big-number.ts'
import {
  BUS_PASSENGERS_PER_VEHICLE,
  calculateBusEmissionFactorPerPassengerKm,
  calculateCarEmissionFactorPerPassengerKm,
  CAR_PASSENGERS_PER_VEHICLE,
} from './vehicle-occupancy.ts'

describe('vehicle-occupancy', () => {
  it('une voiture transporte 1,4 passager (courte distance) et un bus 10', () => {
    expect({
      car: CAR_PASSENGERS_PER_VEHICLE.toFixed(),
      bus: BUS_PASSENGERS_PER_VEHICLE.toFixed(),
    }).toEqual({ car: '1.4', bus: '10' })
  })

  it('divise le facteur d’une voiture par 1,4 : 0,28 kgCO2e/véh.km donnent 0,2 par passager.km', () => {
    expect(calculateCarEmissionFactorPerPassengerKm(toBig('0.28')).toFixed()).toBe('0.2')
  })

  it('divise le facteur d’un bus par 10 : 0,95 kgCO2e/véh.km donnent 0,095 par passager.km', () => {
    expect(calculateBusEmissionFactorPerPassengerKm(toBig('0.95')).toFixed()).toBe('0.095')
  })
})
