import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildOrganicAreas } from './build-organic-areas.ts'
import { readOrganicSources } from './read-organic-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function committed(file: string): string {
  return readFileSync(join(dataDirectory, 'fertilisation-azotee', file), 'utf8')
}

describe('buildOrganicAreas, sources versionnées Agence Bio 2024', () => {
  const build = readOrganicSources(dataDirectory).andThen(buildOrganicAreas)._unsafeUnwrap()

  it.each([
    ['organic-epci-departements.csv', build.epciDepartementsCsv],
    ['organic-departements.csv', build.departementsCsv],
  ])('reconstruit %s à l’identique', (file, csv) => {
    expect(csv).toBe(committed(file))
  })

  it('compte 1 248 couples EPCI-département, 50 masqués par le secret statistique, et 96 départements', () => {
    expect({
      epciDepartements: build.epciDepartementCount,
      masked: build.maskedEpciDepartementCount,
      departements: build.departementCount,
    }).toEqual({ epciDepartements: 1248, masked: 50, departements: 96 })
  })

  it('les départements totalisent 2 713 507,61 ha, 2 520 de plus que les EPCI (247 ha sans EPCI exploitable, le reste sous secret statistique)', () => {
    expect({
      departements: build.departementsHectares,
      epciDepartements: build.epciDepartementsHectares,
    }).toEqual({ departements: '2713507.613387205955', epciDepartements: '2710987.79718421088' })
  })

  it('le chargeur accepte les deux jeux, totaux de contrôle compris', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    expect({
      epciDepartements: dataSource
        .rows('fertilisation-azotee/organic-epci-departements')
        ._unsafeUnwrap().length,
      departements: dataSource.rows('fertilisation-azotee/organic-departements')._unsafeUnwrap()
        .length,
    }).toEqual({ epciDepartements: 1248, departements: 96 })
  })
})
