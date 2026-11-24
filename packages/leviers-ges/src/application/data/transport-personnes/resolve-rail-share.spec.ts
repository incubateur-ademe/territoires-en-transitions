import { ok } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import type { RegionLookup } from '../../estimate/estimation-context.ts'
import { quantity } from '../../../domain/units.ts'
import { resolveRailShare } from './resolve-rail-share.ts'

const REGION_BY_COMMUNE: Readonly<Record<string, string | undefined>> = {
  '75056': '11',
  '92050': '11',
  '01001': '84',
}

const getRegionByCommune: RegionLookup = (commune) => ok(REGION_BY_COMMUNE[commune])

function railShareOf(communes: readonly string[]): string | undefined {
  return resolveRailShare({ requested: undefined, communes, getRegionByCommune })
    ._unsafeUnwrap()
    .fraction.toFixed()
}

describe('resolveRailShare', () => {
  it('garde la part saisie et ne la dit pas par défaut', () => {
    const requested = quantity<'Fraction'>('0.6')
    const railShare = resolveRailShare({ requested, communes: ['01001'], getRegionByCommune })
    expect(railShare._unsafeUnwrap()).toEqual({ fraction: requested, defaulted: false })
  })

  it('donne 82 % à un territoire dont toutes les communes sont en Île-de-France', () => {
    expect(railShareOf(['75056', '92050'])).toBe('0.82')
  })

  it('donne 24 % à un territoire hors Île-de-France', () => {
    expect(railShareOf(['01001'])).toBe('0.24')
  })

  it('donne 24 % à un territoire à cheval sur l’Île-de-France et une autre région', () => {
    expect(railShareOf(['75056', '01001'])).toBe('0.24')
  })

  it('donne 24 % à une commune dont la région est inconnue', () => {
    expect(railShareOf(['99999'])).toBe('0.24')
  })

  it('donne 24 % à un territoire sans commune', () => {
    expect(railShareOf([])).toBe('0.24')
  })

  it('dit que la part est celle par défaut', () => {
    const railShare = resolveRailShare({ requested: undefined, communes: ['01001'], getRegionByCommune })
    expect(railShare._unsafeUnwrap().defaulted).toBe(true)
  })
})
