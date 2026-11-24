import { describe, expect, it } from 'vitest'
import { quantity } from '../../../domain/units.ts'
import { calculateRegionalAreaShares, type LocatedArea } from './calculate-regional-area-shares.ts'

function area(commune: string, region: string, hectares: string): LocatedArea {
  return { commune, region, hectares: quantity<'Hectares'>(hectares) }
}

const AREAS: readonly LocatedArea[] = [
  area('01001', '84', '100'),
  area('01002', '84', '300'),
  area('75056', '11', '50'),
]

function sharesOf(communes: readonly string[]): Record<string, string> {
  const shares = calculateRegionalAreaShares({ areas: AREAS, territoryCommunes: new Set(communes) })
  return Object.fromEntries([...shares].map(([region, share]) => [region, share.toFixed()]))
}

describe('calculateRegionalAreaShares', () => {
  it('une commune de 100 ha dans une région de 400 ha pèse 25 %', () => {
    expect(sharesOf(['01001'])).toEqual({ '84': '0.25' })
  })

  it('toutes les communes d’une région pèsent 100 %', () => {
    expect(sharesOf(['01001', '01002'])).toEqual({ '84': '1' })
  })

  it('un territoire sur deux régions a une part dans chacune', () => {
    expect(sharesOf(['01002', '75056'])).toEqual({ '84': '0.75', '11': '1' })
  })

  it('ignore une commune absente de la SAU', () => {
    expect(sharesOf(['01001', '00000'])).toEqual({ '84': '0.25' })
  })

  it('ne retient pas une région où le territoire n’a aucune SAU', () => {
    const withEmptyCommune = [...AREAS, area('2A004', '94', '0')]
    const shares = calculateRegionalAreaShares({
      areas: withEmptyCommune,
      territoryCommunes: new Set(['2A004']),
    })
    expect([...shares]).toEqual([])
  })

  it('garde l’exactitude d’un tiers sans erreur de flottant', () => {
    const thirds = [area('a', '1', '1'), area('b', '1', '2')]
    const shares = calculateRegionalAreaShares({ areas: thirds, territoryCommunes: new Set(['a']) })
    expect(shares.get('1')?.toFixed()).toBe('0.333333333333333333333333333333')
  })
})
