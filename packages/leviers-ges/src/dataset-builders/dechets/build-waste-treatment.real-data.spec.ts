import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildWasteTreatment } from './build-waste-treatment.ts'
import { readWasteSources } from './read-waste-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function readCommitted(file: string): string {
  return readFileSync(join(dataDirectory, 'dechets', file), 'utf8')
}

describe('buildWasteTreatment, sources versionnées IREP 2022 et FE_déchets', () => {
  const build = readWasteSources(dataDirectory).andThen(buildWasteTreatment)._unsafeUnwrap()

  it('reconstruit treatment-flows.csv à l’identique', () => {
    expect(build.flowsCsv).toBe(readCommitted('treatment-flows.csv'))
  })

  it('reconstruit emission-factors.csv à l’identique', () => {
    expect(build.emissionFactorsCsv).toBe(readCommitted('emission-factors.csv'))
  })

  it('compte 1 105 flux, 10 805 952,18 t de stockage et 11 752 749,177 t d’incinération avec récupération', () => {
    expect({
      flows: build.flowCount,
      storage: build.storageTonnes,
      incineration: build.incinerationTonnes,
      total: build.totalTonnes,
    }).toEqual({
      flows: 1105,
      storage: '10805952.18',
      incineration: '11752749.177',
      total: '22558701.357',
    })
  })

  it('ne laisse aucun flux sur une commune absente de la géographie', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    const communes = new Set(
      dataSource
        .rows('territoires/communes')
        ._unsafeUnwrap()
        .map((row) => row['code_commune']),
    )
    const unknown = dataSource
      .rows('dechets/treatment-flows')
      ._unsafeUnwrap()
      .filter((row) => !communes.has(row['commune_code']))
    expect(unknown).toEqual([])
  })
})
