import { describe, expect, it } from 'vitest'
import { quantity } from './units.ts'
import {
  calculateHeavyVehicleEmissionFactors,
  calculateThermalShare,
  ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR,
  HEAVY_VEHICLE_LOADING_RATE,
} from './heavy-vehicle-emission-factor.ts'

function factorsOf({
  diesel,
  fleet,
  zeroEmission,
}: {
  diesel: string
  fleet: string
  zeroEmission: string
}) {
  return calculateHeavyVehicleEmissionFactors({
    dieselEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(diesel),
    heavyVehicleFleet: quantity<'Vehicles'>(fleet),
    zeroEmissionFleet: quantity<'Vehicles'>(zeroEmission),
  })
}

describe('calculateHeavyVehicleEmissionFactors', () => {
  it('divise le facteur par véhicule.km par le taux de chargement de 8,1 t : 0,81 kgCO2e/véh.km donnent 0,1 kgCO2e/t.km', () => {
    expect(factorsOf({ diesel: '0.81', fleet: '100', zeroEmission: '0' }).thermal.toFixed()).toBe('0.1')
  })

  it('ne mélange rien sans poids lourd zéro émission : le facteur mixte égale le thermique', () => {
    const factors = factorsOf({ diesel: '0.81', fleet: '100', zeroEmission: '0' })
    expect({ mixed: factors.mixed.toFixed(), share: factors.zeroEmissionShare.toFixed() }).toEqual({
      mixed: '0.1',
      share: '0',
    })
  })

  it('pondère le thermique et l’électrique par la part du parc : 25 % à 0,0467 et 75 % à 0,1 donnent 0,086675', () => {
    const factors = factorsOf({ diesel: '0.81', fleet: '100', zeroEmission: '25' })
    expect({ mixed: factors.mixed.toFixed(), share: factors.zeroEmissionShare.toFixed() }).toEqual({
      mixed: '0.086675',
      share: '0.25',
    })
  })

  it('prend le facteur électrique pour un parc entièrement électrique', () => {
    expect(factorsOf({ diesel: '0.81', fleet: '100', zeroEmission: '100' }).mixed.toFixed()).toBe(
      ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR.toFixed(),
    )
  })

  it('utilise 8,1 t de chargement et 0,0467 kgCO2e/t.km pour l’électrique', () => {
    expect({
      loading: HEAVY_VEHICLE_LOADING_RATE.toFixed(),
      electric: ELECTRIC_HEAVY_VEHICLE_EMISSION_FACTOR.toFixed(),
    }).toEqual({ loading: '8.1', electric: '0.0467' })
  })
})

describe('calculateThermalShare', () => {
  it('complète la part zéro émission à 100 % : 0,25 laisse 0,75', () => {
    expect(calculateThermalShare(quantity<'Fraction'>('0.25')).toFixed()).toBe('0.75')
  })
})
