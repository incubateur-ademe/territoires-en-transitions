import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import {
  calculateTransportPersonnesSobrieteDeplacementsReduction,
  type SobrieteFlows,
} from './calculate-transport-personnes-sobriete-deplacements-reduction.ts'

function flows(overrides: Partial<Record<keyof SobrieteFlows, string>> = {}): SobrieteFlows {
  const values = {
    carWeeklyPassengerKm: '1000',
    publicTransportWeeklyPassengerKm: '1000',
    carEmissionFactor: '0.1165',
    busEmissionFactor: '0.8',
    ...overrides,
  }
  return {
    carWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(values.carWeeklyPassengerKm),
    publicTransportWeeklyPassengerKm: quantity<'PassengerKilometresPerWeek'>(
      values.publicTransportWeeklyPassengerKm,
    ),
    carEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.carEmissionFactor),
    busEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(values.busEmissionFactor),
  }
}

function reduction({
  distanceReduction = '1',
  input = flows(),
}: {
  distanceReduction?: string
  input?: SobrieteFlows
}): string {
  return calculateTransportPersonnesSobrieteDeplacementsReduction({
    distanceReduction: quantity<'Fraction'>(distanceReduction),
    railShare: quantity<'Fraction'>('0.6'),
    railEmissionFactor: quantity<'KgCo2ePerPassengerKilometre'>('0.02'),
    flows: input,
  })
    .decimalPlaces(6)
    .toFixed()
}

describe('calculateTransportPersonnesSobrieteDeplacementsReduction', () => {
  it('ne réduit rien sans réduction des distances', () => {
    expect(reduction({ distanceReduction: '0' })).toBe('0')
  })

  it('supprime tous les trajets : 1 000 passagers.km en voiture à 0,1 et 1 000 en transport en commun à 0,044 évitent 6,632953 tCO2e', () => {
    expect(reduction({})).toBe('6.632953')
  })

  it('est proportionnelle à la réduction : la moitié évite la moitié', () => {
    expect(reduction({ distanceReduction: '0.5' })).toBe('3.316476')
  })

  it('compte les voitures seules : 4,338793 tCO2e', () => {
    expect(reduction({ input: flows({ publicTransportWeeklyPassengerKm: '0' }) })).toBe('4.338793')
  })

  it('compte le transport en commun seul, ferré et bus ensemble : 2,29416 tCO2e', () => {
    expect(reduction({ input: flows({ carWeeklyPassengerKm: '0' }) })).toBe('2.29416')
  })
})
