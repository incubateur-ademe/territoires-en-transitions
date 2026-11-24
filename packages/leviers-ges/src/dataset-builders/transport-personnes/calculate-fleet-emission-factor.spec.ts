import { describe, expect, it } from 'vitest'
import { toBig } from '../../domain/big-number.ts'
import { calculateFleetEmissionFactor } from './calculate-fleet-emission-factor.ts'

const EMISSION_FACTORS = { diesel: '0.2', electrique: '0.1' }

describe('calculateFleetEmissionFactor', () => {
  it('pondère le facteur de chaque carburant par la taille de son parc', () => {
    const result = calculateFleetEmissionFactor({
      counts: { diesel: toBig('3'), electrique: toBig('1') },
      emissionFactors: EMISSION_FACTORS,
    })
    expect(result.emissionFactor?.toFixed()).toBe('0.175')
    expect(result.classifiedVehicles.toFixed()).toBe('4')
    expect(result.unclassifiedShare.toFixed()).toBe('0')
  })

  it('exclut un carburant sans facteur du facteur moyen et en donne la part', () => {
    const result = calculateFleetEmissionFactor({
      counts: { diesel: toBig('3'), electrique: toBig('1'), autre: toBig('4') },
      emissionFactors: EMISSION_FACTORS,
    })
    expect(result.emissionFactor?.toFixed()).toBe('0.175')
    expect(result.unclassifiedShare.toFixed()).toBe('0.5')
    expect(result.classifiedShare.toFixed()).toBe('0.5')
  })

  it('donne deux facteurs différents au même parc selon les carburants qui portent un facteur', () => {
    const counts = { diesel: toBig('3'), electrique: toBig('1') }
    const wholeFleet = calculateFleetEmissionFactor({ counts, emissionFactors: EMISSION_FACTORS })
    const thermalFleet = calculateFleetEmissionFactor({
      counts,
      emissionFactors: { diesel: '0.2' },
    })
    expect({
      wholeFleet: wholeFleet.emissionFactor?.toFixed(),
      thermalFleet: thermalFleet.emissionFactor?.toFixed(),
      thermalShare: thermalFleet.classifiedShare.toFixed(),
    }).toEqual({ wholeFleet: '0.175', thermalFleet: '0.2', thermalShare: '0.75' })
  })

  it('compte zéro pour un carburant absent du parc', () => {
    const result = calculateFleetEmissionFactor({
      counts: { diesel: toBig('2') },
      emissionFactors: EMISSION_FACTORS,
    })
    expect(result.emissionFactor?.toFixed()).toBe('0.2')
  })

  it('ne donne aucun facteur quand tout le parc est sans facteur', () => {
    const result = calculateFleetEmissionFactor({
      counts: { autre: toBig('5') },
      emissionFactors: EMISSION_FACTORS,
    })
    expect(result.emissionFactor).toBeUndefined()
    expect(result.classifiedVehicles.toFixed()).toBe('0')
    expect(result.unclassifiedShare.toFixed()).toBe('1')
    expect(result.classifiedShare.toFixed()).toBe('0')
  })

  it('ne donne aucun facteur ni part exclue pour un parc vide', () => {
    const result = calculateFleetEmissionFactor({ counts: {}, emissionFactors: EMISSION_FACTORS })
    expect(result.emissionFactor).toBeUndefined()
    expect(result.unclassifiedShare.toFixed()).toBe('0')
    expect(result.classifiedShare.toFixed()).toBe('0')
  })
})
