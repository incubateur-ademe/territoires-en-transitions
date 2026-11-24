import { describe, expect, it } from 'vitest'
import { buildForestAreas } from './build-forest-areas.ts'

const HEADER =
  'insee,epci,departement,foret_mixte_surface_ha,foret_feuillu_surface_ha,foret_conifere_surface_ha,foret_peupleraie_surface_ha'

function forest(...lines: readonly string[]): string {
  return `${[HEADER, ...lines].join('\n')}\n`
}

const FOREST_CSV = forest(
  '2,200000003,2A,0,0,7,0',
  '02001,200000002,02,5,5,0,0',
  '01003,200000002,01,10,0,0,0',
  '01002,200000001,01,0.1,0,0,0',
  '01001,200000001,01,0.2,2,3,4',
  '22016,,22,0,2.25,0,0',
)

describe('buildForestAreas', () => {
  const built = buildForestAreas(FOREST_CSV)._unsafeUnwrap()

  it('somme les quatre types de peuplement et les communes d’un même couple EPCI-département', () => {
    expect(built.epciDepartementsCsv).toBe(
      [
        'epci_departement,code_epci,code_departement,forest_hectares',
        '200000001-01,200000001,01,9.3',
        '200000002-01,200000002,01,10',
        '200000002-02,200000002,02,10',
        '200000003-2A,200000003,2A,7',
        '',
      ].join('\n'),
    )
  })

  it('écrit les départements triés, communes sans EPCI comprises', () => {
    expect(built.departementsCsv).toBe(
      [
        'code_departement,forest_hectares',
        '01,19.3',
        '02,10',
        '22,2.25',
        '2A,7',
        '',
      ].join('\n'),
    )
  })

  it('compte les lignes et totalise les hectares : la commune sans EPCI n’est que dans les départements', () => {
    expect({
      epciDepartements: built.epciDepartementCount,
      departements: built.departementCount,
      epciDepartementsHectares: built.epciDepartementsHectares,
      departementsHectares: built.departementsHectares,
    }).toEqual({
      epciDepartements: 4,
      departements: 4,
      epciDepartementsHectares: '36.3',
      departementsHectares: '38.55',
    })
  })

  it('refuse une surface qui n’est pas un nombre décimal', () => {
    expect(buildForestAreas(forest('01001,200000001,01,abc,0,0,0'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/foret-departement',
      reason: 'unreadable',
      detail: 'foret_mixte_surface_ha=abc is not a decimal number',
    })
  })

  it('refuse une source sans colonne de surface', () => {
    expect(buildForestAreas('insee,epci,departement\n01001,200000001,01\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/foret-departement',
      reason: 'columns_mismatch',
      detail: 'foret_mixte_surface_ha',
    })
  })

  it('refuse une source sans colonne départementale', () => {
    expect(
      buildForestAreas(
        'insee,epci,foret_mixte_surface_ha,foret_feuillu_surface_ha,foret_conifere_surface_ha,foret_peupleraie_surface_ha\n01001,200000001,1,0,0,0\n',
      )._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'departement' })
  })

  it('refuse une commune sans département', () => {
    expect(buildForestAreas(forest('01001,200000001,,1,0,0,0'))._unsafeUnwrapErr()).toMatchObject({
      reason: 'empty_key',
      detail: 'departement',
    })
  })

  it('refuse d’écrire un code EPCI qui exigerait un guillemet CSV', () => {
    expect(
      buildForestAreas(forest('01001,"20,1",01,1,0,0,0'))._unsafeUnwrapErr(),
    ).toMatchObject({ dataset: 'produits-bois', reason: 'malformed_csv' })
  })
})
