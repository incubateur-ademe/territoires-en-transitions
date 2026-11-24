import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildWoodProduction } from './build-wood-production.ts'
import { readWoodSources } from './read-wood-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function committed(file: string): string {
  return readFileSync(join(dataDirectory, 'produits-bois', file), 'utf8')
}

describe('buildWoodProduction, sources versionnées Agreste EXFNR00 et OMINEA 2026', () => {
  const build = readWoodSources(dataDirectory).andThen(buildWoodProduction)._unsafeUnwrap()

  it.each([
    ['regions.csv', build.regionsCsv],
    ['departements.csv', build.departementsCsv],
    ['constants.csv', build.constantsCsv],
  ])('reconstruit %s à l’identique', (file, csv) => {
    expect(csv).toBe(committed(file))
  })

  it('compte 13 régions et 96 départements', () => {
    expect({ regions: build.regionCount, departements: build.departementCount }).toEqual({
      regions: 13,
      departements: 96,
    })
  })

  it('les 13 régions retrouvent la France métropolitaine : 19 975 et 10 311 milliers de m³', () => {
    expect(build.regionTotals).toEqual({
      logsThousandM3: '19975',
      industrialWoodThousandM3: '10311',
    })
  })

  it('les 96 départements s’écartent de 3 milliers de m³ de la France métropolitaine', () => {
    expect(build.departementTotals).toEqual({
      logsThousandM3: '19978',
      industrialWoodThousandM3: '10308',
    })
  })

  it('le chargeur accepte les trois jeux, totaux de contrôle compris', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    expect({
      regions: dataSource.rows('produits-bois/regions')._unsafeUnwrap().length,
      departements: dataSource.rows('produits-bois/departements')._unsafeUnwrap().length,
      timberCarbon: dataSource
        .constant('produits-bois/constants', 'timber_products_carbon_tc')
        ._unsafeUnwrap(),
      industrialCarbon: dataSource
        .constant('produits-bois/constants', 'industrial_products_carbon_tc')
        ._unsafeUnwrap(),
    }).toEqual({ regions: 13, departements: 96, timberCarbon: '1706703', industrialCarbon: '2234630' })
  })
})
