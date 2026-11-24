import { describe, expect, it } from 'vitest'
import { buildLivestockHeadcounts } from './build-livestock-headcounts.ts'

const AGRESTE_HEADER = 'geographie,libelle_geographie,code_categorie,libelle_categorie,valeur'
const CARTOSTAT_HEADER = 'maille,code,libelle,vaches_laitieres_2020'
const HEADCOUNT_COLUMNS =
  'dairy_cows,other_cattle,sows,other_pigs,goats,sheep,horses,mules_and_donkeys,laying_hens,broilers,other_poultry'

function toAgresteCsv(...lines: string[]): string {
  return [AGRESTE_HEADER, ...lines].join('\n')
}

function toCartostatCsv(...lines: string[]): string {
  return [CARTOSTAT_HEADER, ...lines].join('\n')
}

function cell(geography: string, category: string, value: string): string {
  return `${geography},TERRITOIRE,${category},CATEGORIE,${value}`
}

function departementWith(categories: Readonly<Record<string, string>>): string {
  return toAgresteCsv(...Object.entries(categories).map(([category, value]) => cell('01', category, value)))
}

const FULL_CATEGORIES = {
  '1': '100',
  '2': '30',
  '2.15': '10',
  '3': '7',
  '4': '8',
  '5': '60',
  '5.11': '15',
  '7': '1000',
  '7.11': '600',
  '7.11.1': '100',
  '7.11.2': '200',
  '7.11.3': '50',
  '7.11.4': '250',
}

const DAIRY_CARTOSTAT = toCartostatCsv('departement,01,Ain,40')

function departementCsvOf(agresteCsv: string, cartostatCsv = DAIRY_CARTOSTAT) {
  return buildLivestockHeadcounts({ agresteCsv, cartostatCsv })._unsafeUnwrap().departements
}

describe('buildLivestockHeadcounts, effectifs par catégorie', () => {
  it('déduit les onze catégories de l’OMINEA de celles d’Agreste et de cartostat', () => {
    expect(departementCsvOf(departementWith(FULL_CATEGORIES)).csv).toBe(
      `code_departement,${HEADCOUNT_COLUMNS}\n01,40,60,15,45,7,8,20,10,350,250,400\n`,
    )
  })

  it('totalise chaque colonne et compte les territoires', () => {
    const departements = departementCsvOf(departementWith(FULL_CATEGORIES))
    expect({ territories: departements.territoryCount, totals: departements.totals }).toEqual({
      territories: 1,
      totals: {
        dairy_cows: '40',
        other_cattle: '60',
        sows: '15',
        other_pigs: '45',
        goats: '7',
        sheep: '8',
        horses: '20',
        mules_and_donkeys: '10',
        laying_hens: '350',
        broilers: '250',
        other_poultry: '400',
      },
    })
  })

  it('compte une catégorie sous secret pour zéro et la dénombre', () => {
    const departements = departementCsvOf(departementWith({ ...FULL_CATEGORIES, '4': 's', '7.11.2': 's' }))
    expect(departements.csv).toContain('01,40,60,15,45,7,0,20,10,150,250,400\n')
    expect(departements.secretCellCount).toBe(2)
  })

  it('compte une catégorie absente pour zéro sans la dénombrer', () => {
    const withoutGoats = Object.fromEntries(
      Object.entries(FULL_CATEGORIES).filter(([category]) => category !== '3'),
    )
    const departements = departementCsvOf(departementWith(withoutGoats))
    expect(departements.csv).toContain('01,40,60,15,45,0,8,20,10,350,250,400\n')
    expect(departements.secretCellCount).toBe(0)
  })

  it('retombe sur la somme des sous-catégories quand les poules et poulettes sont sous secret', () => {
    const departements = departementCsvOf(departementWith({ ...FULL_CATEGORIES, '7.11': 's' }))
    expect(departements.csv).toContain('01,40,60,15,45,7,8,20,10,350,250,400\n')
  })

  it('ramène une différence négative à zéro', () => {
    const departements = departementCsvOf(
      departementWith({ ...FULL_CATEGORIES, '1': '30', '5': '10', '2': '5', '7': '100' }),
    )
    expect(departements.csv).toContain('01,40,0,15,0,7,8,0,10,350,250,0\n')
  })

  it.each([
    ['secret', toCartostatCsv('departement,01,Ain,secret')],
    ['absente', toCartostatCsv('departement,02,Aisne,40')],
  ])('compte des vaches laitières %s pour zéro et la dénombre', (_label, cartostatCsv) => {
    const departements = departementCsvOf(departementWith(FULL_CATEGORIES), cartostatCsv)
    expect(departements.csv).toContain('01,0,100,15,45,7,8,20,10,350,250,400\n')
    expect(departements.secretCellCount).toBe(1)
  })
})

describe('buildLivestockHeadcounts, territoires retenus', () => {
  it('lit les régions par le préfixe NR et leurs vaches laitières dans cartostat', () => {
    const regions = buildLivestockHeadcounts({
      agresteCsv: toAgresteCsv(
        ...Object.entries(FULL_CATEGORIES).map(([category, value]) => cell('NR84', category, value)),
      ),
      cartostatCsv: toCartostatCsv('region,84,Auvergne-Rhône-Alpes,40', 'departement,84,Autre,999'),
    })._unsafeUnwrap().regions
    expect(regions.csv).toBe(`code_region,${HEADCOUNT_COLUMNS}\n84,40,60,15,45,7,8,20,10,350,250,400\n`)
  })

  it.each(['NR01', 'NR99', '01', 'FR'])('écarte la géographie %s du niveau des régions', (geography) => {
    const regions = buildLivestockHeadcounts({
      agresteCsv: toAgresteCsv(cell(geography, '3', '5')),
      cartostatCsv: toCartostatCsv('region,01,Guadeloupe,0'),
    })._unsafeUnwrap().regions
    expect(regions.territoryCount).toBe(0)
  })

  it.each(['971', 'DOM', 'FR', 'METRO', 'NR84'])(
    'écarte la géographie %s du niveau des départements',
    (geography) => {
      const departements = departementCsvOf(toAgresteCsv(cell(geography, '3', '5')))
      expect(departements.territoryCount).toBe(0)
    },
  )

  it('garde 2A et 2B et trie par code', () => {
    const departements = departementCsvOf(
      toAgresteCsv(cell('2B', '3', '5'), cell('2A', '3', '6'), cell('01', '3', '7')),
      toCartostatCsv('departement,01,Ain,1', 'departement,2A,A,1', 'departement,2B,B,1'),
    )
    expect(departements.csv.split('\n').map((line) => line.slice(0, 2))).toEqual([
      'co',
      '01',
      '2A',
      '2B',
      '',
    ])
  })
})

describe('buildLivestockHeadcounts, erreurs', () => {
  it('refuse une valeur Agreste qui n’est ni un nombre ni le repère du secret', () => {
    expect(
      buildLivestockHeadcounts({
        agresteCsv: toAgresteCsv(cell('01', '3', 'beaucoup')),
        cartostatCsv: DAIRY_CARTOSTAT,
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'elevage-durable/sources/agreste-ra2020-cheptels-departement-region.csv',
      reason: 'unreadable',
      detail: 'valeur=beaucoup (catégorie 3) is neither a decimal number nor the secret mark',
    })
  })

  it('refuse des vaches laitières qui ne sont ni un nombre ni le repère du secret', () => {
    expect(
      buildLivestockHeadcounts({
        agresteCsv: departementWith(FULL_CATEGORIES),
        cartostatCsv: toCartostatCsv('departement,01,Ain,beaucoup'),
      })._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'elevage-durable/sources/cartostat-vaches-laitieres-2020-departements-regions.csv',
      reason: 'unreadable',
      detail: 'vaches_laitieres_2020=beaucoup is neither a decimal number nor the secret mark',
    })
  })

  it('refuse un nom de colonne de sortie qui demanderait des guillemets', () => {
    expect(
      buildLivestockHeadcounts({
        agresteCsv: toAgresteCsv(cell('2A', '3', '1')),
        cartostatCsv: toCartostatCsv('departement,2A,"Corse, du Sud",1'),
      }).isOk(),
    ).toBe(true)
  })

  it('refuse un relevé Agreste mal formé', () => {
    expect(
      buildLivestockHeadcounts({ agresteCsv: 'a,b\n1,2,3', cartostatCsv: DAIRY_CARTOSTAT })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'elevage-durable/sources/agreste-ra2020-cheptels-departement-region.csv',
      reason: 'malformed_csv',
    })
  })

  it('refuse un relevé Agreste sans colonne des valeurs', () => {
    expect(
      buildLivestockHeadcounts({
        agresteCsv: 'geographie,code_categorie\n01,3',
        cartostatCsv: DAIRY_CARTOSTAT,
      })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'valeur' })
  })

  it('refuse un relevé cartostat mal formé', () => {
    expect(
      buildLivestockHeadcounts({
        agresteCsv: departementWith(FULL_CATEGORIES),
        cartostatCsv: 'a,b\n1,2,3',
      })._unsafeUnwrapErr(),
    ).toMatchObject({
      dataset: 'elevage-durable/sources/cartostat-vaches-laitieres-2020-departements-regions.csv',
      reason: 'malformed_csv',
    })
  })

  it('refuse un relevé cartostat sans colonne des vaches', () => {
    expect(
      buildLivestockHeadcounts({
        agresteCsv: departementWith(FULL_CATEGORIES),
        cartostatCsv: 'maille,code\ndepartement,01',
      })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch', detail: 'vaches_laitieres_2020' })
  })
})
