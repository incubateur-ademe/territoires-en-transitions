import { describe, expect, it } from 'vitest'
import type { HeatNetwork } from '../../domain/heat-network.ts'
import { quantity } from '../../domain/units.ts'
import { weightHeatEmissionFactor } from './weight-heat-emission-factor.ts'

function network(deliveredMwh: string, emissionFactor: string): HeatNetwork {
  return {
    deliveredMwh: quantity<'MegawattHours'>(deliveredMwh),
    emissionFactor: quantity<'KgCo2ePerKwh'>(emissionFactor),
  }
}

describe('weightHeatEmissionFactor', () => {
  it('un seul réseau garde son facteur', () => {
    expect(weightHeatEmissionFactor([network('1000', '0.1')]).toFixed()).toBe('0.1')
  })

  it('pondère par la chaleur livrée : 1000 MWh à 0,1 et 3000 MWh à 0,2 donnent 0,175', () => {
    const networks = [network('1000', '0.1'), network('3000', '0.2')]
    expect(weightHeatEmissionFactor(networks).toFixed()).toBe('0.175')
  })

  it('un réseau très livré pèse plus qu’un réseau peu livré', () => {
    const networks = [network('1', '0.5'), network('999', '0')]
    expect(weightHeatEmissionFactor(networks).toFixed()).toBe('0.0005')
  })

  it('sans réseau, le facteur est nul', () => {
    expect(weightHeatEmissionFactor([]).toFixed()).toBe('0')
  })

  it('des réseaux sans livraison donnent un facteur nul au lieu d’une division par zéro', () => {
    expect(weightHeatEmissionFactor([network('0', '0.3')]).toFixed()).toBe('0')
  })
})
