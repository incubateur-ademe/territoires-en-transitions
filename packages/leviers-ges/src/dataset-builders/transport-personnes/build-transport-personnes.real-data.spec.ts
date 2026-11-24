import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { buildTransportPersonnes } from './build-transport-personnes.ts'
import { readTransportSources } from './read-transport-sources.ts'

const dataDirectory = join(import.meta.dirname, '..', '..', '..', 'data')

function committed(file: string): string {
  return readFileSync(join(dataDirectory, 'transport-personnes', file), 'utf8')
}

describe('buildTransportPersonnes, sources versionnées Insee-SDES 2022 et parc SDES 2025', () => {
  const build = readTransportSources(dataDirectory).andThen(buildTransportPersonnes)._unsafeUnwrap()

  it.each([
    ['regions.csv', build.regions.csv],
    ['departements.csv', build.departements.csv],
    ['epcis.csv', build.epcis.csv],
  ])('reconstruit %s à l’identique', (file, csv) => {
    expect(csv).toBe(committed(file))
  })

  it('compte 13 régions, 96 départements et 1 243 EPCI', () => {
    expect({
      regions: build.regions.territoryCount,
      departements: build.departements.territoryCount,
      epcis: build.epcis.territoryCount,
    }).toEqual({ regions: 13, departements: 96, epcis: 1243 })
  })

  it('les régions et les départements retrouvent 2,12 milliards de passagers.km de voiture par semaine à 0,02 près', () => {
    expect({
      regions: build.regions.controlTotals.car_weekly_passenger_km,
      departements: build.departements.controlTotals.car_weekly_passenger_km,
    }).toEqual({ regions: '2121170446.04', departements: '2121170446.02' })
  })

  it('les EPCI retrouvent les régions à 0,001 % près, le code 999999999 hors champ étant écarté', () => {
    expect(build.epcis.controlTotals.car_weekly_passenger_km).toBe('2121142472.17')
  })

  it('le chargeur accepte les trois jeux, totaux de contrôle compris', () => {
    const dataSource = createCsvDataSource(dataDirectory)
    expect({
      regions: dataSource.rows('transport-personnes/regions')._unsafeUnwrap().length,
      departements: dataSource.rows('transport-personnes/departements')._unsafeUnwrap().length,
      epcis: dataSource.rows('transport-personnes/epcis')._unsafeUnwrap().length,
    }).toEqual({ regions: 13, departements: 96, epcis: 1243 })
  })
})
