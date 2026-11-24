import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildForestAreas } from './build-forest-areas.ts'
import { readForestSourceText } from './read-forest-source.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function committed(file: string): string {
  return readFileSync(join(dataDirectory, 'produits-bois', file), 'utf8')
}

describe('buildForestAreas, source versionnée ALDO stocks de carbone', () => {
  const build = readForestSourceText(dataDirectory).andThen(buildForestAreas)._unsafeUnwrap()

  it.each([
    ['foret-epci-departement.csv', build.epciDepartementsCsv],
    ['foret-departement.csv', build.departementsCsv],
  ])('reconstruit %s à l’identique', (file, csv) => {
    expect(csv).toBe(committed(file))
  })

  it('compte 1 341 couples EPCI-département et 96 départements', () => {
    expect({
      epciDepartements: build.epciDepartementCount,
      departements: build.departementCount,
    }).toEqual({ epciDepartements: 1341, departements: 96 })
  })

  it('les départements totalisent 18 497 934,5 ha de forêt, 552,5 ha de plus que les EPCI (communes sans EPCI)', () => {
    expect({
      departements: build.departementsHectares,
      epciDepartements: build.epciDepartementsHectares,
    }).toEqual({ departements: '18497934.5', epciDepartements: '18497382' })
  })

  it('le chargeur accepte les deux jeux, totaux de contrôle compris', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    expect({
      epciDepartements: dataSource.rows('produits-bois/foret-epci-departement')._unsafeUnwrap().length,
      departements: dataSource.rows('produits-bois/foret-departement')._unsafeUnwrap().length,
    }).toEqual({ epciDepartements: 1341, departements: 96 })
  })
})
