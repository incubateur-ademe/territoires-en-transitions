import { describe, expect, it } from 'vitest'
import { buildTerritoryOccupation } from './build-territory-occupation.ts'
import { FACTOR_COLUMNS, SURFACE_COLUMNS } from './occupation-columns.ts'

const SURFACE_SOURCES = SURFACE_COLUMNS.map(({ source }) => source)

const FACTOR_SOURCES = [...new Set(FACTOR_COLUMNS.flatMap(({ sources }) => sources))]

const FACTOR_OUTPUTS = FACTOR_COLUMNS.map(({ output }) => output)

function toCsv({
  header,
  rows,
}: {
  header: readonly string[]
  rows: readonly (readonly string[])[]
}): string {
  return `${[header, ...rows].map((fields) => fields.join(',')).join('\n')}\n`
}

function surfaceCommunes(
  ...communes: readonly (readonly [
    departement: string,
    region: string,
    factorSet: string,
    overrides: Readonly<Record<string, string>>,
  ])[]
): string {
  const header = ['insee', 'epci', 'departement', 'region', 'jeu', ...SURFACE_SOURCES]
  const rows = communes.map(([departement, region, factorSet, overrides], index) => [
    String(index),
    '200000001',
    departement,
    region,
    factorSet,
    ...SURFACE_SOURCES.map((column) => overrides[column] ?? '0'),
  ])
  return toCsv({ header, rows })
}

function factorSets(
  ...sets: readonly (readonly [factorSet: string, overrides: Readonly<Record<string, string>>])[]
): string {
  const header = ['jeu', ...FACTOR_SOURCES]
  const rows = sets.map(([factorSet, overrides]) => [
    factorSet,
    ...FACTOR_SOURCES.map((column) => overrides[column] ?? '0'),
  ])
  return toCsv({ header, rows })
}

const SOL_COLUMN = 'cultures_vers_zones humides_sol_tCO2e_ha-1'

const FACTOR_SETS_CSV = factorSets(['J01', { [SOL_COLUMN]: '10' }], ['J02', { [SOL_COLUMN]: '40' }])

const cropland = (hectares: string) => ({ cultures_surface_ha: hectares })

function croplandToWetlandOf(csv: string, row: number): string | undefined {
  const [header, ...rows] = csv.trim().split('\n')
  const index = header?.split(',').indexOf('cropland_to_wetland') ?? -1
  return rows[row]?.split(',')[index]
}

function build(surfacesCsv: string, territoryKind: 'departement' | 'region' = 'departement') {
  return buildTerritoryOccupation({
    surfacesCsv,
    factorSetsCsv: FACTOR_SETS_CSV,
    territoryKind,
  })
}

describe('buildTerritoryOccupation', () => {
  it('somme les surfaces des communes de chaque territoire, triées par code', () => {
    const built = build(
      surfaceCommunes(
        ['02', '32', 'J01', cropland('10.5')],
        ['01', '84', 'J01', cropland('4')],
        ['02', '32', 'J02', cropland('0.25')],
      ),
    )._unsafeUnwrap()
    const [header, ...rows] = built.surfacesCsv.trim().split('\n')
    expect({ header: header?.split(',').slice(0, 2), rows: rows.map((row) => row.split(',').slice(0, 2)) }).toEqual({
      header: ['code_departement', 'cropland_ha'],
      rows: [['01', '4'], ['02', '10.75']],
    })
    expect(built.territoryCount).toBe(2)
    expect(built.surfaceTotals['cropland_ha']).toBe('14.75')
  })

  it('pondère le facteur par la surface du type de départ : (30 × 10 + 10 × 40) ÷ 40 = 17,5', () => {
    const built = build(
      surfaceCommunes(['01', '84', 'J01', cropland('30')], ['01', '84', 'J02', cropland('10')]),
    )._unsafeUnwrap()
    expect(croplandToWetlandOf(built.factorsCsv, 0)).toBe('17.5')
  })

  it('prend la moyenne simple des communes quand la surface de pondération est nulle', () => {
    const built = build(surfaceCommunes(['75', '11', 'J01', {}], ['75', '11', 'J02', {}]))._unsafeUnwrap()
    expect(croplandToWetlandOf(built.factorsCsv, 0)).toBe('25')
  })

  it('regroupe par région', () => {
    const built = build(
      surfaceCommunes(['01', '84', 'J01', cropland('1')], ['02', '84', 'J02', cropland('3')]),
      'region',
    )._unsafeUnwrap()
    expect(built.surfacesCsv.split('\n')[0]?.split(',')[0]).toBe('code_region')
    expect({ count: built.territoryCount, factor: croplandToWetlandOf(built.factorsCsv, 0) }).toEqual({
      count: 1,
      factor: '32.5',
    })
    expect(built.factorsCsv.split('\n')[0]?.split(',').slice(1)).toEqual(FACTOR_OUTPUTS)
  })

  it('écarte une commune sans territoire', () => {
    const built = build(surfaceCommunes(['', '84', 'J01', cropland('9')], ['01', '84', 'J01', cropland('1')]))._unsafeUnwrap()
    expect(built.territoryCount).toBe(1)
    expect(built.surfaceTotals['cropland_ha']).toBe('1')
  })

  it('écarte aussi une commune sans région', () => {
    const built = build(
      surfaceCommunes(['01', '', 'J01', cropland('9')], ['01', '84', 'J01', cropland('1')]),
      'region',
    )._unsafeUnwrap()
    expect({ count: built.territoryCount, cropland: built.surfaceTotals['cropland_ha'] }).toEqual({
      count: 1,
      cropland: '1',
    })
  })

  it('garde un facteur négatif dans la moyenne pondérée : (1 × −10 + 3 × 30) ÷ 4 = 20', () => {
    const negative = factorSets(['J01', { [SOL_COLUMN]: '-10' }], ['J02', { [SOL_COLUMN]: '30' }])
    const built = buildTerritoryOccupation({
      surfacesCsv: surfaceCommunes(['01', '84', 'J01', cropland('1')], ['01', '84', 'J02', cropland('3')]),
      factorSetsCsv: negative,
      territoryKind: 'departement',
    })._unsafeUnwrap()
    expect(croplandToWetlandOf(built.factorsCsv, 0)).toBe('20')
  })

  it('refuse une commune dont le jeu de facteurs est inconnu', () => {
    expect(build(surfaceCommunes(['01', '84', 'J99', cropland('1')]))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'occupation-des-sols/departements-facteurs',
      reason: 'missing_key_column',
      detail: 'J99',
    })
  })

  it('refuse un fichier de surfaces sans colonne jeu', () => {
    expect(build('insee,departement,region\n1,01,84\n')._unsafeUnwrapErr()).toMatchObject({
      reason: 'columns_mismatch',
    })
  })

  it('refuse un fichier de surfaces mal formé', () => {
    expect(build('a,b\n1,2,3')._unsafeUnwrapErr()).toMatchObject({ reason: 'malformed_csv' })
  })
})
