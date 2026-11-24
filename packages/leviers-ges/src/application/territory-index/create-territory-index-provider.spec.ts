import { err } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { invalidDataset, type DataRow, type DataSource } from '../../domain/data-source.ts'
import { dataSourceFromDatasets } from '../../testing/data-source-from-datasets.ts'
import { createTerritoryIndexProvider } from './create-territory-index-provider.ts'

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
]

function countingDataSource(base: DataSource, loads: string[]): DataSource {
  return {
    ...base,
    rows: (dataset) => {
      loads.push(dataset)
      return base.rows(dataset)
    },
  }
}

describe('createTerritoryIndexProvider', () => {
  it('construit l’index une seule fois pour plusieurs appels', () => {
    const loads: string[] = []
    const provider = createTerritoryIndexProvider(
      countingDataSource(dataSourceFromDatasets({ 'territoires/communes': COMMUNES }), loads),
    )
    const first = provider()._unsafeUnwrap()
    const second = provider()._unsafeUnwrap()
    expect({ loads: loads.length, sameIndex: first === second }).toEqual({ loads: 1, sameIndex: true })
  })

  it('ne retient pas un échec : l’index se construit à l’appel suivant', () => {
    const loads: string[] = []
    const healthy = dataSourceFromDatasets({ 'territoires/communes': COMMUNES })
    const transientFailure = invalidDataset({
      dataset: 'territoires/communes',
      reason: 'unreadable',
      detail: 'EMFILE',
    })
    const flaky: DataSource = {
      ...healthy,
      rows: (dataset) => {
        loads.push(dataset)
        return loads.length === 1 ? err(transientFailure) : healthy.rows(dataset)
      },
    }
    const provider = createTerritoryIndexProvider(flaky)
    expect(provider()._unsafeUnwrapErr()).toEqual(transientFailure)
    expect(provider().isOk()).toBe(true)
    expect(loads).toHaveLength(2)
  })
})
