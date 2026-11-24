import { describe, expect, it } from 'vitest'
import type { DataRow, DataSource } from '../../domain/data-source.ts'
import { territoryCodeSchema, type Level, type Territory } from '../../domain/territory.ts'
import { dataSourceFromDatasets } from '../../testing/data-source-from-datasets.ts'
import { createEstimationContext } from './create-estimation-context.ts'

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '75056', code_epci: '', code_departement: '75', code_region: '11' },
]

function toTerritory(level: Level, code: string): Territory<Level> {
  return { level, code: territoryCodeSchema.parse(code) }
}

function toCountingDataSource(loads: string[]): DataSource {
  const base = dataSourceFromDatasets({ 'territoires/communes': COMMUNES })
  return {
    ...base,
    rows: (dataset) => {
      loads.push(dataset)
      return base.rows(dataset)
    },
  }
}

describe('createEstimationContext', () => {
  it('expose la source de données reçue', () => {
    const dataSource = dataSourceFromDatasets({})
    expect(createEstimationContext(dataSource).dataSource).toBe(dataSource)
  })

  it('ne charge rien tant qu’on ne demande pas de communes', () => {
    const loads: string[] = []
    createEstimationContext(toCountingDataSource(loads))
    expect(loads).toEqual([])
  })

  it.each([
    ['region', '84', ['01001', '01002']],
    ['departement', '75', ['75056']],
    ['epci', '200000001', ['01001', '01002']],
  ] as const)('donne les communes du niveau %s %s', (level, code, expected) => {
    const { getCommunesOf } = createEstimationContext(toCountingDataSource([]))
    expect(getCommunesOf(toTerritory(level, code))._unsafeUnwrap()).toEqual(expected)
  })

  it('charge l’index des territoires une seule fois pour plusieurs demandes', () => {
    const loads: string[] = []
    const { getCommunesOf } = createEstimationContext(toCountingDataSource(loads))
    getCommunesOf(toTerritory('region', '84'))._unsafeUnwrap()
    getCommunesOf(toTerritory('region', '11'))._unsafeUnwrap()
    expect(loads).toEqual(['territoires/communes'])
  })

  it.each([
    ['01001', '84'],
    ['75056', '11'],
  ])('donne la région de la commune %s : %s', (commune, region) => {
    const { getRegionByCommune } = createEstimationContext(toCountingDataSource([]))
    expect(getRegionByCommune(commune)._unsafeUnwrap()).toBe(region)
  })

  it('ne donne pas de région à une commune absente de la géographie', () => {
    const { getRegionByCommune } = createEstimationContext(toCountingDataSource([]))
    expect(getRegionByCommune('99999')._unsafeUnwrap()).toBeUndefined()
  })

  it('renvoie l’erreur de la source quand les communes sont absentes pour une région', () => {
    const { getRegionByCommune } = createEstimationContext(dataSourceFromDatasets({}))
    expect(getRegionByCommune('01001')._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'territoires/communes',
    })
  })

  it('renvoie un territoire inconnu tel quel', () => {
    const { getCommunesOf } = createEstimationContext(toCountingDataSource([]))
    expect(getCommunesOf(toTerritory('region', '99'))._unsafeUnwrapErr()).toEqual({
      kind: 'unknown_territory',
      level: 'region',
      code: '99',
    })
  })

  it('renvoie l’erreur de la source quand les communes sont absentes', () => {
    const { getCommunesOf } = createEstimationContext(dataSourceFromDatasets({}))
    expect(getCommunesOf(toTerritory('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'territoires/communes',
    })
  })
})
