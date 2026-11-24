import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildHousingSurfaces } from './build-housing-surfaces.ts'
import { readHousingSourceText } from './read-housing-source.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function committed(file: string): string {
  return readFileSync(join(dataDirectory, 'residentiel-logements', file), 'utf8')
}

describe('buildHousingSurfaces, source versionnée INSEE RP2022', () => {
  const build = readHousingSourceText(dataDirectory).andThen(buildHousingSurfaces)._unsafeUnwrap()

  it.each([
    ['logements-epci-departement.csv', build.epciDepartementsCsv],
    ['logements-departement.csv', build.departementsCsv],
  ])('reconstruit %s à l’identique', (file, csv) => {
    expect(csv).toBe(committed(file))
  })

  it('compte 1 330 couples EPCI-département et 96 départements', () => {
    expect({
      epciDepartements: build.epciDepartementCount,
      departements: build.departementCount,
    }).toEqual({ epciDepartements: 1330, departements: 96 })
  })

  it('les départements totalisent 2 471 785 159,0 m², 290 740,3 m² de plus que les EPCI (communes sans EPCI)', () => {
    expect({
      departements: build.departementsSquareMetres,
      epciDepartements: build.epciDepartementsSquareMetres,
    }).toEqual({
      departements: '2471785159.005887670575',
      epciDepartements: '2471494418.705718308944',
    })
  })

  it('le chargeur accepte les deux jeux, totaux de contrôle compris', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    expect({
      epciDepartements: dataSource
        .rows('residentiel-logements/logements-epci-departement')
        ._unsafeUnwrap().length,
      departements: dataSource.rows('residentiel-logements/logements-departement')._unsafeUnwrap()
        .length,
    }).toEqual({ epciDepartements: 1330, departements: 96 })
  })

  it('Paris : 17 114 221,13 m² d’appartements privés au gaz construits avant 1971', () => {
    const paris = createCsvDataSource(dataDirectory)
      .rows('residentiel-logements/logements-departement')
      ._unsafeUnwrap()
      .find((row) => row['code_departement'] === '75')
    expect(paris?.['housing_m2_private_apartment_natural_gas_before_1971']).toBe('17114221.134292869665')
  })
})
