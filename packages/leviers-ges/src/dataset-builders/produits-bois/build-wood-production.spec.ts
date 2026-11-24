import { describe, expect, it } from 'vitest'
import { buildWoodProduction } from './build-wood-production.ts'

const HARVEST_HEADER = 'annee,geographie,code_modalite,modalite,valeur_milliers_m3'

function harvest(...lines: readonly string[]): string {
  return `${[HARVEST_HEADER, ...lines].join('\n')}\n`
}

const CARBON_CSV = `annee,sciages_tC,bois_oeuvre_tC_sciages_plus_contreplaques,bois_industrie_tC_panneaux_plus_papier
2021,1,1700000,2200000
2022,2,1706703,2234630
`

const HARVEST_CSV = harvest(
  '2022,METRO,1.11,Grumes,100',
  "2022,METRO,1.12,Bois d'industrie,50",
  '2022,NR84,1.11,Grumes,60',
  "2022,NR84,1.12,Bois d'industrie,30",
  '2022,NR94,1.11,Grumes,40',
  '2022,2A,1.11,Grumes,5',
  '2022,01,1.11,Grumes,10',
  "2022,01,1.12,Bois d'industrie,5",
  '2022,01,1.13,Bois énergie,999',
  '2022,01,1,Récolte de bois,1014',
  '2021,01,1.11,Grumes,777',
)

function build(harvestCsv: string, productsCarbonCsv = CARBON_CSV) {
  return buildWoodProduction({ harvestCsv, productsCarbonCsv })
}

describe('buildWoodProduction', () => {
  const built = build(HARVEST_CSV)._unsafeUnwrap()

  it('écrit les régions triées, avec un 0 pour le bois d’industrie absent', () => {
    expect(built.regionsCsv).toBe(
      'code_region,logs_thousand_m3,industrial_wood_thousand_m3\n84,60,30\n94,40,0\n',
    )
  })

  it('écrit les départements triés, 2A après 01, avec un 0 pour le bois d’industrie absent', () => {
    expect(built.departementsCsv).toBe(
      'code_departement,logs_thousand_m3,industrial_wood_thousand_m3\n01,10,5\n2A,5,0\n',
    )
  })

  it('écrit le national de la ligne METRO et le carbone des produits bois de 2022', () => {
    expect(built.constantsCsv).toBe(
      [
        'name,value',
        'national_logs_thousand_m3,100',
        'national_industrial_wood_thousand_m3,50',
        'timber_products_carbon_tc,1706703',
        'industrial_products_carbon_tc,2234630',
        '',
      ].join('\n'),
    )
  })

  it('ignore les autres années et les autres modalités', () => {
    expect(built.departementsCsv).not.toContain('999')
    expect(built.departementsCsv).not.toContain('777')
    expect(built.departementsCsv).not.toContain('1014')
  })

  it('compte les territoires et totalise régions et départements', () => {
    expect({
      regions: built.regionCount,
      departements: built.departementCount,
      regionTotals: built.regionTotals,
      departementTotals: built.departementTotals,
    }).toEqual({
      regions: 2,
      departements: 2,
      regionTotals: { logsThousandM3: '100', industrialWoodThousandM3: '30' },
      departementTotals: { logsThousandM3: '15', industrialWoodThousandM3: '5' },
    })
  })

  it('refuse une géographie qui n’est ni un département, ni une région, ni METRO', () => {
    expect(build(harvest('2022,XX,1.11,Grumes,1'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'unreadable',
      detail: 'geographie=XX is neither a department, a region nor METRO',
    })
  })

  it('refuse une récolte sans ligne METRO', () => {
    expect(build(harvest('2022,NR84,1.11,Grumes,60'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'missing_key_column',
      detail: 'METRO',
    })
  })

  it('refuse une valeur de récolte qui n’est pas un nombre', () => {
    expect(build(harvest('2022,METRO,1.11,Grumes,beaucoup'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'unreadable',
      detail: 'valeur_milliers_m3=beaucoup is not a decimal number',
    })
  })

  it('refuse une récolte à laquelle il manque une colonne', () => {
    expect(build('annee,geographie\n2022,METRO\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'columns_mismatch',
      detail: 'code_modalite',
    })
  })

  it('refuse une récolte sans colonne année', () => {
    expect(build('geographie\nMETRO\n')._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
      detail: 'annee',
    })
  })

  it('ignore une valeur illisible sur une ligne d’une autre modalité', () => {
    const withBrokenEnergyWood = harvest(
      '2022,METRO,1.11,Grumes,100',
      "2022,METRO,1.12,Bois d'industrie,50",
      '2022,METRO,1.13,Bois énergie,beaucoup',
    )
    expect(build(withBrokenEnergyWood).isOk()).toBe(true)
  })

  it('refuse deux lignes pour la même géographie et la même modalité', () => {
    const duplicated = harvest(
      '2022,METRO,1.11,Grumes,100',
      "2022,METRO,1.12,Bois d'industrie,50",
      '2022,METRO,1.11,Grumes,101',
    )
    expect(build(duplicated)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'duplicate_key',
      detail: 'METRO:1.11',
    })
  })

  it('refuse une géographie sans grumes', () => {
    const withoutLogs = harvest(
      '2022,METRO,1.11,Grumes,100',
      "2022,METRO,1.12,Bois d'industrie,50",
      "2022,01,1.12,Bois d'industrie,5",
    )
    expect(build(withoutLogs)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'missing_key_column',
      detail: '01:1.11',
    })
  })

  it('refuse une France métropolitaine sans bois d’industrie au lieu de le compter pour 0', () => {
    expect(build(harvest('2022,METRO,1.11,Grumes,100'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/agreste-exfnr00-recolte-bois-2018-2022.csv',
      reason: 'missing_key_column',
      detail: 'METRO:1.12',
    })
  })

  it('refuse une série de produits bois sans colonne année', () => {
    expect(build(HARVEST_CSV, 'sciages_tC\n1\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/sources/ominea-2026-tableau-45-produits-bois-tc.csv',
      reason: 'columns_mismatch',
      detail: 'annee',
    })
  })

  it('refuse une série de produits bois sans l’année de la récolte', () => {
    const withoutYear = [
      'annee,bois_oeuvre_tC_sciages_plus_contreplaques,bois_industrie_tC_panneaux_plus_papier',
      '2021,1,2',
      '',
    ].join('\n')
    expect(build(HARVEST_CSV, withoutYear)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/sources/ominea-2026-tableau-45-produits-bois-tc.csv',
      reason: 'missing_key_column',
      detail: '2022',
    })
  })

  it('refuse une série de produits bois à laquelle il manque une colonne', () => {
    expect(build(HARVEST_CSV, 'annee\n2022\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/sources/ominea-2026-tableau-45-produits-bois-tc.csv',
      reason: 'columns_mismatch',
    })
  })

  it('refuse un carbone de produits bois qui n’est pas un nombre', () => {
    const broken =
      'annee,bois_oeuvre_tC_sciages_plus_contreplaques,bois_industrie_tC_panneaux_plus_papier\n2022,beaucoup,2\n'
    expect(build(HARVEST_CSV, broken)._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/sources/ominea-2026-tableau-45-produits-bois-tc.csv',
      reason: 'unreadable',
    })
  })

  it('refuse un CSV de récolte illisible', () => {
    expect(build('a,b\n"1')._unsafeUnwrapErr()).toMatchObject({ reason: 'malformed_csv' })
  })

  it('refuse un CSV de produits bois illisible', () => {
    expect(build(HARVEST_CSV, 'a,b\n"1')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/sources/ominea-2026-tableau-45-produits-bois-tc.csv',
      reason: 'malformed_csv',
    })
  })
})
