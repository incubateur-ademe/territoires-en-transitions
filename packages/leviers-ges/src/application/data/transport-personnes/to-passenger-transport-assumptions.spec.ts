import { describe, expect, it } from 'vitest'
import type { RailShare } from './resolve-rail-share.ts'
import type { TransportInputs } from './transport-inputs.ts'
import { quantity } from '../../../domain/units.ts'
import type { RailEmissionFactor } from './rail-emission-factor.ts'
import { toPassengerTransportAssumptions } from './to-passenger-transport-assumptions.ts'

const TRANSPORT_INPUTS: TransportInputs = {
  carWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>('1'),
  publicTransportWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>('1'),
  carEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>('0.1165'),
  busEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>('0.8'),
  carFleetUnclassifiedShare: quantity<'Fraction'>('0'),
  busFleetUnclassifiedShare: quantity<'Fraction'>('0'),
  carFleetClassified: quantity<'Vehicles'>('10'),
  busFleetClassified: quantity<'Vehicles'>('10'),
}

const REQUESTED: RailShare = { fraction: quantity<'Fraction'>('0.3'), defaulted: false }
const DEFAULTED: RailShare = { fraction: quantity<'Fraction'>('0.24'), defaulted: true }

const MAINLAND: RailEmissionFactor = {
  emissionFactor: quantity<'KgCo2ePerPassengerKilometre'>('0.0229'),
  isCorsican: false,
}
const CORSICAN: RailEmissionFactor = {
  emissionFactor: quantity<'KgCo2ePerPassengerKilometre'>('0.187'),
  isCorsican: true,
}

describe('toPassengerTransportAssumptions', () => {
  it('annonce toujours le facteur du bus et celui du ferré', () => {
    const assumptions = toPassengerTransportAssumptions({
      transportInputs: TRANSPORT_INPUTS,
      railShare: REQUESTED,
      railEmissionFactor: MAINLAND,
    })
    expect(Object.keys(assumptions)).toEqual(['busEmissionFactor', 'railEmissionFactor'])
    expect(assumptions['railEmissionFactor']?.value).toBe('0.0229')
    expect(assumptions['railEmissionFactor']?.source).toContain('TER moyen 2022')
  })

  it('cite le train de Corse pour un territoire corse', () => {
    const assumptions = toPassengerTransportAssumptions({
      transportInputs: TRANSPORT_INPUTS,
      railShare: REQUESTED,
      railEmissionFactor: CORSICAN,
    })
    expect(assumptions['railEmissionFactor']?.value).toBe('0.187')
    expect(assumptions['railEmissionFactor']?.source).toContain('train de voyageurs corse')
  })

  it('annonce la part ferrée par défaut, les parts exclues et les moyennes nationales', () => {
    const assumptions = toPassengerTransportAssumptions({
      transportInputs: {
        ...TRANSPORT_INPUTS,
        carFleetUnclassifiedShare: quantity<'Fraction'>('0.01'),
        busFleetUnclassifiedShare: quantity<'Fraction'>('0.02'),
        carFleetClassified: quantity<'Vehicles'>('0'),
        busFleetClassified: quantity<'Vehicles'>('0'),
      },
      railShare: DEFAULTED,
      railEmissionFactor: MAINLAND,
    })
    expect(Object.keys(assumptions)).toEqual([
      'busEmissionFactor',
      'railEmissionFactor',
      'railShare',
      'carFleetUnclassifiedShare',
      'busFleetUnclassifiedShare',
      'nationalCarEmissionFactor',
      'nationalBusEmissionFactor',
    ])
    expect(
      Object.values(assumptions).every(({ source, limit }) => source !== '' && limit !== ''),
    ).toBe(true)
  })
})
