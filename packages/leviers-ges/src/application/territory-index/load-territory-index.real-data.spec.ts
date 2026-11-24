import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { territoryCodeSchema, type Level, type Territory } from '../../domain/territory.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { loadTerritoryIndex } from './load-territory-index.ts'

const dataSource = createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data'))
const index = loadTerritoryIndex(dataSource)._unsafeUnwrap()
const rows = dataSource.rows('territoires/communes')._unsafeUnwrap()

function territory<L extends Level>(level: L, code: string): Territory<L> {
  return { level, code: territoryCodeSchema.parse(code) }
}

function distinctFilled(column: string): string[] {
  const filled = rows.flatMap((row) => {
    const value = row[column]
    return value === undefined || value === '' ? [] : [value]
  })
  return [...new Set(filled)]
}

describe('index des territoires, géographie au 2026-10-07', () => {
  it('compte 34969 communes', () => {
    expect(rows).toHaveLength(34_969)
  })

  it('compte 26 codes région, outre-mer compris, dont les communes somment aux 34969', () => {
    const regions = distinctFilled('code_region')
    const total = regions.flatMap((code) => index.communesOf(territory('region', code))._unsafeUnwrap())
    expect({ regions: regions.length, communes: total.length }).toEqual({ regions: 26, communes: 34_969 })
  })

  it('compte 1255 EPCI dont 89 à cheval sur plusieurs départements', () => {
    const epcis = distinctFilled('code_epci')
    const straddling = epcis.filter(
      (code) => index.departementsOf(territory('epci', code))._unsafeUnwrap().length > 1,
    )
    expect({ epcis: epcis.length, straddling: straddling.length }).toEqual({ epcis: 1255, straddling: 89 })
  })

  it('98 communes n’ont aucun EPCI', () => {
    const inAnEpci = distinctFilled('code_epci').flatMap((code) =>
      index.communesOf(territory('epci', code))._unsafeUnwrap(),
    )
    expect({
      withoutEpci: rows.filter((row) => row['code_epci'] === '').length,
      notInAnyEpci: rows.length - inAnEpci.length,
    }).toEqual({ withoutEpci: 98, notInAnyEpci: 98 })
  })

  it('la Métropole du Grand Paris compte 130 communes sur 6 départements', () => {
    const grandParis = territory('epci', '200054781')
    expect({
      communes: index.communesOf(grandParis)._unsafeUnwrap().length,
      departements: index.departementsOf(grandParis)._unsafeUnwrap(),
    }).toEqual({ communes: 130, departements: ['75', '91', '92', '93', '94', '95'] })
  })

  it('la Corse regroupe 124 communes de la 2A et 236 de la 2B sous la région 94', () => {
    expect({
      haute: index.communesOf(territory('departement', '2A'))._unsafeUnwrap().length,
      basse: index.communesOf(territory('departement', '2B'))._unsafeUnwrap().length,
      region: index.communesOf(territory('region', '94'))._unsafeUnwrap().length,
    }).toEqual({ haute: 124, basse: 236, region: 360 })
  })

  it('Paris, Lyon et Marseille sont chacune une commune, sans arrondissements', () => {
    expect({
      paris: index.communesOf(territory('departement', '75'))._unsafeUnwrap(),
      lyon: index.communesOf(territory('departement', '69'))._unsafeUnwrap().includes('69123'),
      marseille: index.communesOf(territory('departement', '13'))._unsafeUnwrap().includes('13055'),
    }).toEqual({ paris: ['75056'], lyon: true, marseille: true })
  })

  it('Saint-Martin-Saint-Barthélemy et la Polynésie sont des codes région propres', () => {
    expect({
      polynesie: index.communesOf(territory('region', '987'))._unsafeUnwrap().length,
      nouvelleCaledonie: index.communesOf(territory('region', '988'))._unsafeUnwrap().length,
    }).toEqual({ polynesie: 48, nouvelleCaledonie: 33 })
  })
})
