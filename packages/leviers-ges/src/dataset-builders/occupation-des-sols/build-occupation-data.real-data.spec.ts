import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { sum, toBig } from '../../domain/big-number.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildOccupationData } from './build-occupation-data.ts'
import { buildTerritoryOccupation } from './build-territory-occupation.ts'
import { readOccupationSources } from './read-occupation-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function committed(file: string): string {
  return readFileSync(join(dataDirectory, 'occupation-des-sols', file), 'utf8')
}

describe('buildOccupationData, sources versionnées ALDO', () => {
  const build = readOccupationSources(dataDirectory).andThen(buildOccupationData)._unsafeUnwrap()

  it.each([
    ['epcis-surfaces.csv', build.surfacesCsv],
    ['epcis-facteurs.csv', build.factorsCsv],
  ])('reconstruit %s à l’identique', (file, csv) => {
    expect(csv).toBe(committed(file))
  })

  const sources = readOccupationSources(dataDirectory)._unsafeUnwrap()
  const territoryBuilds = {
    departement: buildTerritoryOccupation({ ...sources, territoryKind: 'departement' })._unsafeUnwrap(),
    region: buildTerritoryOccupation({ ...sources, territoryKind: 'region' })._unsafeUnwrap(),
  }

  it.each([
    ['departement', 'departements', 96],
    ['region', 'regions', 13],
  ] as const)('reconstruit les jeux par %s à l’identique', (territoryKind, prefix, count) => {
    const territory = territoryBuilds[territoryKind]
    expect({
      surfaces: territory.surfacesCsv === committed(`${prefix}-surfaces.csv`),
      factors: territory.factorsCsv === committed(`${prefix}-facteurs.csv`),
      count: territory.territoryCount,
    }).toEqual({ surfaces: true, factors: true, count })
  })

  it('compte 1 241 EPCI', () => {
    expect(build.epciCount).toBe(1241)
  })

  it('les forêts totalisent 18 497 382 ha, comme les surfaces de forêt de produits_bois', () => {
    const { forest_mixed_ha, forest_broadleaf_ha, forest_conifer_ha, forest_poplar_ha } =
      build.surfaceTotals
    const forests = [forest_mixed_ha, forest_broadleaf_ha, forest_conifer_ha, forest_poplar_ha]
    expect(sum(forests.map((hectares) => toBig(hectares ?? ''))).toFixed()).toBe('18497382')
  })

  it('le chargeur accepte les six jeux, totaux de contrôle compris', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    const count = (dataset: string) => dataSource.rows(dataset)._unsafeUnwrap().length
    expect({
      epcis: [count('occupation-des-sols/epcis-surfaces'), count('occupation-des-sols/epcis-facteurs')],
      departements: [
        count('occupation-des-sols/departements-surfaces'),
        count('occupation-des-sols/departements-facteurs'),
      ],
      regions: [count('occupation-des-sols/regions-surfaces'), count('occupation-des-sols/regions-facteurs')],
    }).toEqual({ epcis: [1241, 1241], departements: [96, 96], regions: [13, 13] })
  })
})
