import { describe, expect, it } from 'vitest'
import type { RailShare } from '../../application/data/transport-personnes/resolve-rail-share.ts'
import { quantity } from '../../domain/units.ts'
import type {
  ElectrificationFractions,
} from './calculate-transport-personnes-electrification-reduction.ts'
import type { ThermalFleet } from './data/thermal-fleet.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'

const THERMAL_FLEET: ThermalFleet = {
  carThermalEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>('0.17'),
  busThermalEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>('0.8'),
  carThermalFleetShare: quantity<'Fraction'>('0.9'),
  busThermalFleetShare: quantity<'Fraction'>('0.8'),
}

const WITHIN_FLEET: ElectrificationFractions = {
  carElectrification: quantity<'Fraction'>('0.5'),
  busElectrification: quantity<'Fraction'>('0.5'),
}

const BEYOND_FLEET: ElectrificationFractions = {
  carElectrification: quantity<'Fraction'>('1'),
  busElectrification: quantity<'Fraction'>('1'),
}

const REQUESTED: RailShare = { fraction: quantity<'Fraction'>('0.3'), defaulted: false }
const DEFAULTED: RailShare = { fraction: quantity<'Fraction'>('0.24'), defaulted: true }

describe('toAppliedAssumptions, électrification', () => {
  it('annonce toujours les facteurs d’émission de l’électrique, par véhicule.km', () => {
    const assumptions = toAppliedAssumptions({
      fractions: WITHIN_FLEET,
      thermalFleet: THERMAL_FLEET,
      railShare: REQUESTED,
    })
    expect(Object.keys(assumptions)).toEqual(['electricCarEmissionFactor', 'electricBusEmissionFactor'])
    expect(assumptions['electricCarEmissionFactor']?.value).toBe('0.013345')
    expect(assumptions['electricBusEmissionFactor']?.value).toBe('0.095')
  })

  it('annonce la part ferrée seulement quand elle est celle par défaut', () => {
    const assumptions = toAppliedAssumptions({
      fractions: WITHIN_FLEET,
      thermalFleet: THERMAL_FLEET,
      railShare: DEFAULTED,
    })
    expect(Object.keys(assumptions)).toContain('railShare')
    expect(assumptions['railShare']?.value).toBe('0.24')
  })

  it('annonce la part plafonnée quand la part demandée dépasse le parc thermique, voitures et bus', () => {
    const assumptions = toAppliedAssumptions({
      fractions: BEYOND_FLEET,
      thermalFleet: THERMAL_FLEET,
      railShare: REQUESTED,
    })
    expect(Object.keys(assumptions)).toEqual([
      'electricCarEmissionFactor',
      'electricBusEmissionFactor',
      'carElectrificationFraction',
      'busElectrificationFraction',
    ])
    expect(assumptions['carElectrificationFraction']?.value).toBe('0.9')
    expect(assumptions['busElectrificationFraction']?.value).toBe('0.8')
  })

  it('n’annonce pas de plafond quand la part demandée est exactement le parc thermique', () => {
    const fractions = {
      carElectrification: THERMAL_FLEET.carThermalFleetShare,
      busElectrification: THERMAL_FLEET.busThermalFleetShare,
    }
    const assumptions = toAppliedAssumptions({
      fractions,
      thermalFleet: THERMAL_FLEET,
      railShare: REQUESTED,
    })
    expect(Object.keys(assumptions)).toEqual(['electricCarEmissionFactor', 'electricBusEmissionFactor'])
  })

  it('distingue un territoire sans véhicule thermique d’un plafond atteint', () => {
    const noThermalFleet: ThermalFleet = {
      ...THERMAL_FLEET,
      carThermalFleetShare: quantity<'Fraction'>('0'),
      busThermalFleetShare: quantity<'Fraction'>('0'),
    }
    const assumptions = toAppliedAssumptions({
      fractions: WITHIN_FLEET,
      thermalFleet: noThermalFleet,
      railShare: REQUESTED,
    })
    expect(assumptions['busElectrificationFraction']?.value).toBe('0')
    expect(assumptions['busElectrificationFraction']?.limit).toContain('pas de bus et cars thermiques')
    expect(assumptions['carElectrificationFraction']?.limit).toContain('pas de voitures thermiques')
  })

  it('dit pour chaque hypothèse sa source et sa limite', () => {
    const assumptions = Object.values(
      toAppliedAssumptions({ fractions: BEYOND_FLEET, thermalFleet: THERMAL_FLEET, railShare: DEFAULTED }),
    )
    expect(assumptions).toHaveLength(5)
    expect(assumptions.every(({ source, limit }) => source !== '' && limit !== '')).toBe(true)
  })
})
