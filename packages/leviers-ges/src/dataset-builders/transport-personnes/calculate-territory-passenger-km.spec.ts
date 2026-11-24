import { describe, expect, it } from 'vitest'
import { toBig } from '../../domain/big-number.ts'
import { calculateTerritoryPassengerKm } from './calculate-territory-passenger-km.ts'
import type { CommutingRow } from './read-commuting-passenger-km.ts'

function row({
  weeklyPassengerKm,
  ...fields
}: Partial<Omit<CommutingRow, 'weeklyPassengerKm'>> & {
  mode: string
  weeklyPassengerKm: string
}): CommutingRow {
  return { level: 'DEP', code: '01', ...fields, weeklyPassengerKm: toBig(weeklyPassengerKm) }
}

describe('calculateTerritoryPassengerKm', () => {
  it('compte la moitié des passagers.km de chaque côté, voiture et transport en commun séparés', () => {
    const [territory] = calculateTerritoryPassengerKm([
      row({ mode: '5', weeklyPassengerKm: '100' }),
      row({ mode: '5', weeklyPassengerKm: '60' }),
      row({ mode: '6', weeklyPassengerKm: '20' }),
    ])
    expect(territory?.carWeeklyPassengerKm.toFixed()).toBe('80')
    expect(territory?.publicTransportWeeklyPassengerKm.toFixed()).toBe('10')
  })

  it('ignore les autres modes de transport', () => {
    const [territory] = calculateTerritoryPassengerKm([
      row({ mode: '5', weeklyPassengerKm: '10' }),
      row({ mode: '2', weeklyPassengerKm: '1000' }),
      row({ mode: '4', weeklyPassengerKm: '1000' }),
    ])
    expect(territory?.carWeeklyPassengerKm.toFixed()).toBe('5')
    expect(territory?.publicTransportWeeklyPassengerKm.toFixed()).toBe('0')
  })

  it('écarte les codes hors du champ de la source, à chaque niveau', () => {
    const territories = calculateTerritoryPassengerKm([
      row({ level: 'REG', code: '99', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'DEP', code: '999', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'EPCI', code: 'ZZZZZZZZZ', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'EPCI', code: '999999999', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'DEP', code: '01', mode: '5', weeklyPassengerKm: '1' }),
    ])
    expect(territories.map(({ level, code }) => `${level}|${code}`)).toEqual(['DEP|01'])
  })

  it('range les territoires par code et sépare un même code de deux niveaux', () => {
    const territories = calculateTerritoryPassengerKm([
      row({ level: 'DEP', code: '2A', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'REG', code: '11', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'DEP', code: '11', mode: '5', weeklyPassengerKm: '1' }),
      row({ level: 'DEP', code: '01', mode: '5', weeklyPassengerKm: '1' }),
    ])
    expect(territories.map(({ level, code }) => `${level}|${code}`)).toEqual([
      'DEP|01',
      'REG|11',
      'DEP|11',
      'DEP|2A',
    ])
  })

  it('ne renvoie aucun territoire sans ligne', () => {
    expect(calculateTerritoryPassengerKm([])).toEqual([])
  })
})
