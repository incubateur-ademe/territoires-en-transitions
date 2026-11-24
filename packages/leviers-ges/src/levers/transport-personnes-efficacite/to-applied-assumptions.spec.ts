import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import type { RailShare } from '../../application/data/transport-personnes/resolve-rail-share.ts'
import type { TransportInputs } from '../../application/data/transport-personnes/transport-inputs.ts'
import { toAppliedAssumptions } from './to-applied-assumptions.ts'

function transportInputs(overrides: Partial<Record<keyof TransportInputs, string>> = {}): TransportInputs {
  const values = {
    carEmissionFactor: '0.1165',
    busEmissionFactor: '0.8',
    carFleetUnclassifiedShare: '0',
    busFleetUnclassifiedShare: '0',
    carFleetClassified: '10',
    busFleetClassified: '10',
    ...overrides,
  }
  return {
    carWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>('1'),
    publicTransportWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>('1'),
    carEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.carEmissionFactor),
    busEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.busEmissionFactor),
    carFleetUnclassifiedShare: quantity<'Fraction'>(values.carFleetUnclassifiedShare),
    busFleetUnclassifiedShare: quantity<'Fraction'>(values.busFleetUnclassifiedShare),
    carFleetClassified: quantity<'Vehicles'>(values.carFleetClassified),
    busFleetClassified: quantity<'Vehicles'>(values.busFleetClassified),
  }
}

const REQUESTED: RailShare = { fraction: quantity<'Fraction'>('0.3'), defaulted: false }
const DEFAULTED: RailShare = { fraction: quantity<'Fraction'>('0.24'), defaulted: true }

function namesOf(inputs: TransportInputs, railShare: RailShare): readonly string[] {
  return Object.keys(toAppliedAssumptions({ transportInputs: inputs, railShare }))
}

describe('toAppliedAssumptions', () => {
  it('annonce toujours le potentiel d’écoconduite et le facteur du bus par passager.km', () => {
    const assumptions = toAppliedAssumptions({ transportInputs: transportInputs(), railShare: REQUESTED })
    expect(Object.keys(assumptions)).toEqual(['ecodrivingPotential', 'busEmissionFactor'])
    expect(assumptions['ecodrivingPotential']?.value).toBe('0.1')
    expect(assumptions['busEmissionFactor']?.value).toBe('0.08')
  })

  it('annonce la part ferrée seulement quand elle est celle par défaut', () => {
    const assumptions = toAppliedAssumptions({ transportInputs: transportInputs(), railShare: DEFAULTED })
    expect(namesOf(transportInputs(), DEFAULTED)).toEqual([
      'ecodrivingPotential',
      'busEmissionFactor',
      'railShare',
    ])
    expect(assumptions['railShare']?.value).toBe('0.24')
  })

  it('annonce la part du parc exclue de la moyenne, voitures et bus', () => {
    const inputs = transportInputs({
      carFleetUnclassifiedShare: '0.01',
      busFleetUnclassifiedShare: '0.02',
    })
    const assumptions = toAppliedAssumptions({ transportInputs: inputs, railShare: REQUESTED })
    expect(Object.keys(assumptions)).toEqual([
      'ecodrivingPotential',
      'busEmissionFactor',
      'carFleetUnclassifiedShare',
      'busFleetUnclassifiedShare',
    ])
    expect(assumptions['carFleetUnclassifiedShare']?.value).toBe('0.01')
    expect(assumptions['busFleetUnclassifiedShare']?.value).toBe('0.02')
  })

  it('annonce la moyenne nationale d’un territoire sans véhicule classé, voitures et bus', () => {
    const inputs = transportInputs({ carFleetClassified: '0', busFleetClassified: '0' })
    const assumptions = toAppliedAssumptions({ transportInputs: inputs, railShare: REQUESTED })
    expect(Object.keys(assumptions)).toEqual([
      'ecodrivingPotential',
      'busEmissionFactor',
      'nationalCarEmissionFactor',
      'nationalBusEmissionFactor',
    ])
    expect(assumptions['nationalCarEmissionFactor']?.value).toBe('0.083214285714285714285714285714')
    expect(assumptions['nationalBusEmissionFactor']?.value).toBe('0.08')
  })

  it('dit pour chaque hypothèse sa source et sa limite', () => {
    const inputs = transportInputs({
      carFleetUnclassifiedShare: '0.01',
      busFleetUnclassifiedShare: '0.02',
      carFleetClassified: '0',
      busFleetClassified: '0',
    })
    const assumptions = Object.values(
      toAppliedAssumptions({ transportInputs: inputs, railShare: DEFAULTED }),
    )
    expect(assumptions).toHaveLength(7)
    expect(assumptions.every(({ source, limit }) => source !== '' && limit !== '')).toBe(true)
  })
})
