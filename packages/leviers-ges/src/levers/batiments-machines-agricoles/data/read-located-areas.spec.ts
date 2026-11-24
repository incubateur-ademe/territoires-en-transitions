import { ok } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import type { RegionLookup } from '../../../application/estimate/estimation-context.ts'
import { dataSourceFromDatasets } from '../../../testing/data-source-from-datasets.ts'
import { readLocatedAreas } from './read-located-areas.ts'

const dataSource = dataSourceFromDatasets({
  'surface-agricole-utile/communes': [
    { code_commune: '35001', agricultural_area_ha: '10' },
    { code_commune: '99999', agricultural_area_ha: '5' },
  ],
})

function regionLookup(): RegionLookup {
  return vi.fn((commune: string) => ok(commune.startsWith('35') ? '53' : undefined))
}

describe('readLocatedAreas', () => {
  it('keeps the communes that have a region', () => {
    const areas = readLocatedAreas({ dataSource, getRegionByCommune: regionLookup() })

    expect(areas._unsafeUnwrap().map(({ commune, region }) => ({ commune, region }))).toEqual([
      { commune: '35001', region: '53' },
    ])
  })

  it('locates the communes once for a given data source and lookup', () => {
    const getRegionByCommune = regionLookup()

    readLocatedAreas({ dataSource, getRegionByCommune })
    readLocatedAreas({ dataSource, getRegionByCommune })

    expect(getRegionByCommune).toHaveBeenCalledTimes(2)
  })

  it('locates the communes again for another lookup', () => {
    const otherLookup = regionLookup()

    readLocatedAreas({ dataSource, getRegionByCommune: regionLookup() })
    readLocatedAreas({ dataSource, getRegionByCommune: otherLookup })

    expect(otherLookup).toHaveBeenCalledTimes(2)
  })

  it('reports a malformed row instead of caching it', () => {
    const broken = dataSourceFromDatasets({
      'surface-agricole-utile/communes': [{ code_commune: '35001', agricultural_area_ha: 'abc' }],
    })

    const areas = readLocatedAreas({ dataSource: broken, getRegionByCommune: regionLookup() })

    expect(areas.isErr()).toBe(true)
  })
})
