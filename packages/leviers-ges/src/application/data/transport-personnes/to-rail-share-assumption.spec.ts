import { describe, expect, it } from 'vitest'
import { quantity } from '../../../domain/units.ts'
import { toRailShareAssumption } from './to-rail-share-assumption.ts'

describe('toRailShareAssumption', () => {
  it('annonce la part du ferré par défaut avec sa source et sa limite', () => {
    const assumptions = toRailShareAssumption({
      fraction: quantity<'Fraction'>('0.24'),
      defaulted: true,
    })
    expect(Object.keys(assumptions)).toEqual(['railShare'])
    expect(assumptions['railShare']?.value).toBe('0.24')
    expect(assumptions['railShare']?.limit).toContain('grand réseau de métro ou de tramway')
  })

  it('n’annonce rien quand la part est celle de la requête', () => {
    expect(
      toRailShareAssumption({ fraction: quantity<'Fraction'>('0.6'), defaulted: false }),
    ).toEqual({})
  })
})
