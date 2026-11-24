import { describe, expect, it } from 'vitest'
import { territoryCodeSchema } from '../../domain/territory.ts'
import { dataSourceFromDatasets } from '../../testing/data-source-from-datasets.ts'
import { recordDatasetReads } from './record-dataset-reads.ts'

const territory = { level: 'region', code: territoryCodeSchema.parse('84') } as const

describe('recordDatasetReads', () => {
  it('rend les jeux lus, une fois chacun, puis repart de zéro', () => {
    const recorder = recordDatasetReads(dataSourceFromDatasets({ 'a/un': [{ code: '1' }] }))
    recorder.dataSource.rows('a/un')
    recorder.dataSource.rows('a/un')
    recorder.dataSource.row('a/deux', territory)
    recorder.dataSource.constant('a/trois', 'nom')
    expect(recorder.takeReadDatasets()).toEqual(['a/un', 'a/deux', 'a/trois'])
    expect(recorder.takeReadDatasets()).toEqual([])
  })

  it('rend les résultats de la source enregistrée', () => {
    const recorder = recordDatasetReads(dataSourceFromDatasets({ 'a/un': [{ code: '1' }] }))
    expect(recorder.dataSource.rows('a/un')._unsafeUnwrap()).toEqual([{ code: '1' }])
    expect(recorder.dataSource.provenance('a/un')._unsafeUnwrap().vintage).toBe('2024')
  })
})
