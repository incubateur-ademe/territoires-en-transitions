import { describe, expect, it } from 'vitest'
import { buildOccupationData } from './build-occupation-data.ts'
import { FACTOR_COLUMNS, SURFACE_COLUMNS } from './occupation-columns.ts'

const SURFACE_SOURCES = SURFACE_COLUMNS.map(({ source }) => source)

const FACTOR_SOURCES = [...new Set(FACTOR_COLUMNS.flatMap(({ sources }) => sources))]

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
  ...communes: readonly (readonly [epci: string, overrides: Readonly<Record<string, string>>])[]
): string {
  const header = ['insee', 'epci', 'departement', ...SURFACE_SOURCES]
  const rows = communes.map(([epci, overrides], index) => [
    String(index),
    epci,
    '01',
    ...SURFACE_SOURCES.map((column) => overrides[column] ?? '0'),
  ])
  return toCsv({ header, rows })
}

function factorEpcis(
  ...epcis: readonly (readonly [epci: string, overrides: Readonly<Record<string, string>>])[]
): string {
  const header = ['insee', ...FACTOR_SOURCES]
  const rows = epcis.map(([epci, overrides]) => [
    epci,
    ...FACTOR_SOURCES.map((column) => overrides[column] ?? '0'),
  ])
  return toCsv({ header, rows })
}

const SURFACES_CSV = surfaceCommunes(
  ['200000002', { 'cultures_surface_ha': '10.5', 'forêt mixte_surface_ha': '4' }],
  ['200000001', { 'cultures_surface_ha': '1', 'sols artificiels arbustifs_surface_ha': '0.25' }],
  ['200000002', { 'cultures_surface_ha': '0.25', 'forêt mixte_surface_ha': '6' }],
  ['', { 'cultures_surface_ha': '999' }],
)

const FACTORS_CSV = factorEpcis(
  [
    '200000002',
    {
      'prairies zones arborées_vers_forêt mixte_sol_tCO2e_ha-1': '-12.5',
      'prairies zones arborées_vers_forêt mixte_litiere_tCO2e_ha-1': '33',
      'prairies zones arbustives_vers_zones humides_sol_tCO2e_ha-1': '2',
      'prairies zones arbustives_vers_zones humides_biomasse_tCO2e_ha-1': '-0.5',
      'cultures_vers_zones humides_sol_tCO2e_ha-1': '271.5',
      'sols artificiels imperméabilisés_vers_sols artificiels arbustifs_sol_tCO2e_ha-1': '1e-16',
    },
  ],
  ['200000001', { 'cultures_vers_zones humides_sol_tCO2e_ha-1': '-1.7763568394002508e-16' }],
)

function build(surfacesCsv = SURFACES_CSV, factorsCsv = FACTORS_CSV) {
  return buildOccupationData({ surfacesCsv, factorsCsv })
}

function toObjects(csv: string): readonly Readonly<Record<string, string>>[] {
  const [header = '', ...lines] = csv.trimEnd().split('\n')
  const columns = header.split(',')
  return lines.map((line) =>
    Object.fromEntries(line.split(',').map((value, index) => [columns[index] ?? '', value])),
  )
}

describe('buildOccupationData', () => {
  const built = build()._unsafeUnwrap()

  it('écrit les colonnes de surface dans l’ordre du manifeste', () => {
    expect(built.surfacesCsv.split('\n')[0]).toBe(
      'code_epci,cropland_ha,wooded_grassland_ha,herbaceous_grassland_ha,shrub_grassland_ha,wetland_ha,artificial_shrub_ha,artificial_impervious_ha,artificial_wooded_ha,forest_mixed_ha,forest_broadleaf_ha,forest_conifer_ha,forest_poplar_ha',
    )
  })

  it('somme les communes d’un EPCI, trie les EPCI et écarte les communes sans EPCI', () => {
    expect(toObjects(built.surfacesCsv)).toEqual([
      expect.objectContaining({
        code_epci: '200000001',
        cropland_ha: '1',
        artificial_shrub_ha: '0.25',
        forest_mixed_ha: '0',
      }),
      expect.objectContaining({ code_epci: '200000002', cropland_ha: '10.75', forest_mixed_ha: '10' }),
    ])
  })

  it('totalise chaque type de sol et compte les EPCI', () => {
    expect({
      cropland: built.surfaceTotals['cropland_ha'],
      forest: built.surfaceTotals['forest_mixed_ha'],
      epciCount: built.epciCount,
    }).toEqual({ cropland: '11.75', forest: '10', epciCount: 2 })
  })

  it('additionne les réservoirs d’un facteur : sol −12,5 et litière 33 donnent 20,5', () => {
    expect(toObjects(built.factorsCsv)[1]).toEqual(
      expect.objectContaining({
        code_epci: '200000002',
        wooded_grassland_to_forest_mixed: '20.5',
        shrub_grassland_to_wetland: '1.5',
        cropland_to_wetland: '271.5',
      }),
    )
  })

  it('arrondit le bruit numérique des flux (notation exponentielle) à 0', () => {
    expect(toObjects(built.factorsCsv)).toEqual([
      expect.objectContaining({ code_epci: '200000001', cropland_to_wetland: '0' }),
      expect.objectContaining({
        code_epci: '200000002',
        impervious_to_artificial_shrub: '0',
      }),
    ])
  })

  it('refuse une source dont aucune commune n’a d’EPCI', () => {
    expect(build(surfaceCommunes(['', { 'cultures_surface_ha': '5' }]))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'occupation-des-sols/epcis-surfaces',
      reason: 'empty_dataset',
      detail: 'no commune with an EPCI',
    })
  })

  it('refuse une surface qui n’est pas un nombre', () => {
    const broken = surfaceCommunes(['200000001', { 'cultures_surface_ha': 'beaucoup' }])
    expect(build(broken)._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'occupation-des-sols/epcis-surfaces',
      reason: 'unreadable',
      detail: 'cultures_surface_ha=beaucoup is not a decimal number',
    })
  })

  it('refuse une source de surfaces sans colonne EPCI', () => {
    expect(build('insee,departement\n1,01\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'occupation-des-sols/epcis-surfaces',
      reason: 'columns_mismatch',
      detail: 'epci',
    })
  })

  it('refuse une source de facteurs sans colonne de flux', () => {
    expect(build(SURFACES_CSV, 'insee\n200000001\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'occupation-des-sols/epcis-facteurs',
      reason: 'columns_mismatch',
    })
  })

  it('refuse une source de facteurs sans colonne EPCI', () => {
    expect(build(SURFACES_CSV, 'code\nx\n')._unsafeUnwrapErr()).toMatchObject({
      dataset: 'occupation-des-sols/epcis-facteurs',
      reason: 'columns_mismatch',
      detail: 'insee',
    })
  })
})
