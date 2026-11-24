import { describe, expect, it } from 'vitest'
import { buildOrganicAreas } from './build-organic-areas.ts'

const EPCI_HEADER = 'annee,codedepartement,codeepci,surfbio'
const DEPARTEMENT_HEADER = 'annee,codedepartement,surfbio'

function csv(header: string, ...lines: readonly string[]): string {
  return `${[header, ...lines].join('\n')}\n`
}

const EPCI_CSV = csv(
  EPCI_HEADER,
  '2024,02,200000002,10.5',
  '2024,01,200000002,3.25',
  '2024,01,200000001,100',
  '2024,2A,200000003,0.1234567890123456',
  '2024,01,200000004,NC',
  '2024,01,ZZZZZZZZZ,7',
  '2024,01,NA,NC',
  '2024,44,992367730,145.9',
  '2024,971,200018653,147.2',
)

const DEPARTEMENT_CSV = csv(
  DEPARTEMENT_HEADER,
  '2024,2A,0.1234567890123456',
  '2024,01,103.25',
  '2024,971,1469.8',
  '2024,978,NC',
  '2024,02,NC',
)

function build(epciOrganicCsv: string, departementOrganicCsv = DEPARTEMENT_CSV) {
  return buildOrganicAreas({ epciOrganicCsv, departementOrganicCsv })
}

describe('buildOrganicAreas', () => {
  const built = build(EPCI_CSV)._unsafeUnwrap()

  it('écrit un couple EPCI-département par ligne triée, un EPCI à cheval a une ligne par département', () => {
    expect(built.epciDepartementsCsv).toBe(
      [
        'epci_departement,code_epci,code_departement,organic_hectares',
        '200000001-01,200000001,01,100',
        '200000002-01,200000002,01,3.25',
        '200000002-02,200000002,02,10.5',
        '200000003-2A,200000003,2A,0.123456789012',
        '',
      ].join('\n'),
    )
  })

  it('écarte les EPCI sous secret statistique, les lignes sans EPCI et l’outre-mer', () => {
    expect({
      epciDepartements: built.epciDepartementCount,
      masked: built.maskedEpciDepartementCount,
    }).toEqual({ epciDepartements: 4, masked: 1 })
  })

  it('écrit les départements métropolitains triés, 2A après 01, sans les DROM', () => {
    expect(built.departementsCsv).toBe(
      ['code_departement,organic_hectares', '01,103.25', '2A,0.123456789012', ''].join('\n'),
    )
  })

  it('totalise les hectares écrits, arrondis à 12 décimales', () => {
    expect({
      epciDepartements: built.epciDepartementsHectares,
      departements: built.departementsHectares,
    }).toEqual({ epciDepartements: '113.873456789012', departements: '103.373456789012' })
  })

  it('refuse une surface qui n’est pas un nombre', () => {
    expect(build(csv(EPCI_HEADER, '2024,01,200000001,beaucoup'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'fertilisation-azotee/organic-epci-departements',
      reason: 'unreadable',
      detail: 'surfbio=beaucoup is not a decimal number',
    })
  })

  it('refuse une source EPCI sans colonne EPCI', () => {
    expect(
      build(csv(DEPARTEMENT_HEADER, '2024,01,3'))._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'fertilisation-azotee/organic-epci-departements',
      reason: 'columns_mismatch',
      detail: 'codeepci',
    })
  })

  it('refuse une source départementale sans colonne de surface', () => {
    expect(
      build(EPCI_CSV, 'annee,codedepartement\n2024,01\n')._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'fertilisation-azotee/organic-departements',
      reason: 'columns_mismatch',
      detail: 'surfbio',
    })
  })
})
