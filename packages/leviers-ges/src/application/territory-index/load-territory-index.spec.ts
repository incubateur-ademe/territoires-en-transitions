import { err } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { invalidDataset, type DataRow, type DataSource } from '../../domain/data-source.ts'
import { territoryCodeSchema } from '../../domain/territory.ts'
import { dataSourceFromDatasets } from '../../testing/data-source-from-datasets.ts'
import { loadTerritoryIndex } from './load-territory-index.ts'

function dataSourceOf(rows: readonly DataRow[]): DataSource {
  return dataSourceFromDatasets({ 'territoires/communes': rows })
}

describe('loadTerritoryIndex', () => {
  it('lit les communes avec et sans EPCI', () => {
    const index = loadTerritoryIndex(
      dataSourceOf([
        { code_commune: '01001', code_epci: '200069193', code_departement: '01', code_region: '84' },
        { code_commune: '2A004', code_epci: '', code_departement: '2A', code_region: '94' },
      ]),
    )._unsafeUnwrap()
    const code = territoryCodeSchema.parse('94')
    expect(index.communesOf({ level: 'region', code })._unsafeUnwrap()).toEqual(['2A004'])
    const epci = territoryCodeSchema.parse('200069193')
    expect(index.communesOf({ level: 'epci', code: epci })._unsafeUnwrap()).toEqual(['01001'])
  })

  it('refuse une ligne à laquelle il manque une colonne', () => {
    const result = loadTerritoryIndex(
      dataSourceOf([{ code_commune: '01001', code_epci: '', code_departement: '01' }]),
    )
    expect(result._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'territoires/communes',
      reason: 'columns_mismatch',
      detail: 'code_region',
    })
  })

  it.each(['code_commune', 'code_departement', 'code_region'])(
    'refuse une ligne dont la colonne %s est vide',
    (column) => {
      const row = {
        code_commune: '01001',
        code_epci: '',
        code_departement: '01',
        code_region: '84',
        [column]: ' ',
      }
      expect(loadTerritoryIndex(dataSourceOf([row]))._unsafeUnwrapErr()).toEqual({
        kind: 'invalid_dataset',
        dataset: 'territoires/communes',
        reason: 'empty_key',
        detail: column,
      })
    },
  )

  it('renvoie l’erreur de la source quand le jeu est illisible', () => {
    const failing: DataSource = {
      ...dataSourceOf([]),
      rows: () =>
        err(invalidDataset({ dataset: 'territoires/communes', reason: 'checksum_mismatch', detail: 'x' })),
    }
    expect(loadTerritoryIndex(failing)._unsafeUnwrapErr()).toMatchObject({ reason: 'checksum_mismatch' })
  })
})
