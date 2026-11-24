import { ok } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import type { DepartementLookup } from '../../../application/estimate/estimation-context.ts'
import { dataSourceFromDatasets } from '../../../testing/data-source-from-datasets.ts'
import { readLocatedAreas } from './read-located-areas.ts'

const dataSource = dataSourceFromDatasets({
  'surface-agricole-utile/communes': [
    { code_commune: '35001', agricultural_area_ha: '10' },
    { code_commune: '99999', agricultural_area_ha: '5' },
  ],
})

function departementLookup(): DepartementLookup {
  return vi.fn((commune: string) => ok(commune.startsWith('35') ? '35' : undefined))
}

describe('readLocatedAreas', () => {
  it('keeps the communes that have a département', () => {
    const areas = readLocatedAreas({ dataSource, getDepartementByCommune: departementLookup() })

    expect(areas._unsafeUnwrap().map(({ commune, departement }) => ({ commune, departement }))).toEqual([
      { commune: '35001', departement: '35' },
    ])
  })

  it('locates the communes once for a given data source and lookup', () => {
    const getDepartementByCommune = departementLookup()

    readLocatedAreas({ dataSource, getDepartementByCommune })
    readLocatedAreas({ dataSource, getDepartementByCommune })

    expect(getDepartementByCommune).toHaveBeenCalledTimes(2)
  })

  it('locates the communes again for another lookup', () => {
    const otherLookup = departementLookup()

    readLocatedAreas({ dataSource, getDepartementByCommune: departementLookup() })
    readLocatedAreas({ dataSource, getDepartementByCommune: otherLookup })

    expect(otherLookup).toHaveBeenCalledTimes(2)
  })

  it('reports a malformed row instead of caching it', () => {
    const broken = dataSourceFromDatasets({
      'surface-agricole-utile/communes': [{ code_commune: '35001', agricultural_area_ha: 'abc' }],
    })

    const areas = readLocatedAreas({ dataSource: broken, getDepartementByCommune: departementLookup() })

    expect(areas.isErr()).toBe(true)
  })
})
