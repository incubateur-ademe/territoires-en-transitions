import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildLivestockHeadcounts } from './build-livestock-headcounts.ts'
import { readLivestockSources } from './read-livestock-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function readCommitted(file: string): string {
  return readFileSync(join(dataDirectory, 'elevage-durable', file), 'utf8')
}

describe('buildLivestockHeadcounts, sources versionnées Agreste 2020 et cartostat', () => {
  const headcounts = readLivestockSources(dataDirectory)
    .andThen(buildLivestockHeadcounts)
    ._unsafeUnwrap()

  it('reconstruit regions.csv à l’identique', () => {
    expect(headcounts.regions.csv).toBe(readCommitted('regions.csv'))
  })

  it('reconstruit departements.csv à l’identique', () => {
    expect(headcounts.departements.csv).toBe(readCommitted('departements.csv'))
  })

  it('compte 13 régions et 95 départements', () => {
    expect({
      regions: headcounts.regions.territoryCount,
      departements: headcounts.departements.territoryCount,
    }).toEqual({ regions: 13, departements: 95 })
  })

  it('retrouve les 3 482 723 vaches laitières de France métropolitaine dans les régions', () => {
    expect(headcounts.regions.totals['dairy_cows']).toBe('3482723')
  })

  it('compte 4 cellules sous secret pour les régions et 146 pour les départements', () => {
    expect({
      regions: headcounts.regions.secretCellCount,
      departements: headcounts.departements.secretCellCount,
    }).toEqual({ regions: 4, departements: 146 })
  })

  it('ne laisse aucune région ni aucun département hors de la géographie', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    const communes = dataSource.rows('territoires/communes')._unsafeUnwrap()
    const regions = new Set(communes.map((row) => row['code_region']))
    const departements = new Set(communes.map((row) => row['code_departement']))
    const unknown = [
      ...dataSource
        .rows('elevage-durable/regions')
        ._unsafeUnwrap()
        .filter((row) => !regions.has(row['code_region'])),
      ...dataSource
        .rows('elevage-durable/departements')
        ._unsafeUnwrap()
        .filter((row) => !departements.has(row['code_departement'])),
    ]
    expect(unknown).toEqual([])
  })
})
