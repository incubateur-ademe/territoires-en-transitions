import { describe, expect, it } from 'vitest'
import { buildNitrogenDeliveries } from './build-nitrogen-deliveries.ts'

const HEADER = 'zone,code,libelle,azote_2023_2024_t,evolution_azote_vs_2022_2023_pct,page_pdf'
const REGION_COLUMNS =
  'code_region,nitrogen_delivered_tonnes_2022_2023,nitrogen_delivered_tonnes_2023_2024'
const DEPARTEMENT_COLUMNS =
  'code_departement,nitrogen_delivered_tonnes_2022_2023,nitrogen_delivered_tonnes_2023_2024'

function toCsv(...lines: string[]): string {
  return [HEADER, ...lines].join('\n')
}

function line({ zone, code, tonnes, evolution }: { zone: string; code: string; tonnes: string; evolution: string }): string {
  return `${zone},${code},TERRITOIRE,${tonnes},${evolution},1`
}

function build(...lines: string[]) {
  return buildNitrogenDeliveries({ deliveriesCsv: toCsv(...lines) })
}

describe('buildNitrogenDeliveries, campagne 2022-2023 révisée par l’évolution publiée', () => {
  it.each([
    ['une hausse de 10 %', '110', '10', '100'],
    ['une baisse de 10 %', '90', '-10', '100'],
    ['une évolution nulle', '100', '0', '100'],
    ['une évolution de 30 % sur 100 t, arrondie à 12 décimales', '100', '30', '76.923076923077'],
  ])('déduit la campagne précédente d’après %s', (_label, tonnes, evolution, previous) => {
    const { regions } = build(line({ zone: 'region', code: '11', tonnes, evolution }))._unsafeUnwrap()
    expect(regions.csv).toBe(`${REGION_COLUMNS}\n11,${previous},${tonnes}\n`)
  })

  it('refuse une évolution de −100 %, qui annulerait la campagne précédente', () => {
    expect(
      build(line({ zone: 'region', code: '11', tonnes: '5', evolution: '-100' }))._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'unreadable', detail: 'evolution -100 % cancels or reverses the previous campaign' })
  })

  it('refuse une évolution inférieure à −100 %, qui inverserait la campagne précédente', () => {
    expect(
      build(line({ zone: 'region', code: '11', tonnes: '5', evolution: '-150' }))._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'unreadable', detail: 'evolution -150 % cancels or reverses the previous campaign' })
  })

  it('refuse une évolution qui n’est pas un nombre', () => {
    expect(
      build(line({ zone: 'region', code: '11', tonnes: '5', evolution: 'beaucoup' }))._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'unreadable', detail: '5 / beaucoup' })
  })
})

describe('buildNitrogenDeliveries, régions', () => {
  it('trie les régions par code et totalise les deux campagnes', () => {
    const { regions } = build(
      line({ zone: 'region', code: '84', tonnes: '30', evolution: '0' }),
      line({ zone: 'region', code: '11', tonnes: '10', evolution: '0' }),
    )._unsafeUnwrap()
    expect(regions).toEqual({
      csv: `${REGION_COLUMNS}\n11,10,10\n84,30,30\n`,
      count: 2,
      previousCampaignTonnes: '40',
      latestCampaignTonnes: '40',
    })
  })

  it('refuse des tonnes qui ne sont pas un nombre', () => {
    expect(
      build(line({ zone: 'region', code: '11', tonnes: 'beaucoup', evolution: '0' }))._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'unreadable', detail: 'azote_2023_2024_t=beaucoup is not a decimal number' })
  })

  it('refuse un relevé sans colonne des tonnes', () => {
    expect(
      buildNitrogenDeliveries({ deliveriesCsv: 'zone,code\nregion,11' })._unsafeUnwrapErr(),
    ).toMatchObject({ reason: 'columns_mismatch' })
  })

  it('refuse un relevé mal formé', () => {
    expect(buildNitrogenDeliveries({ deliveriesCsv: 'a,b\n1,2,3' })._unsafeUnwrapErr()).toMatchObject({
      dataset: 'fertilisation-azotee/sources/unifa-azote-2023-2024.csv',
      reason: 'malformed_csv',
    })
  })
})

describe('buildNitrogenDeliveries, départements', () => {
  it('complète les codes sur deux chiffres et trie par code', () => {
    const { departements } = build(
      line({ zone: 'departement', code: '10', tonnes: '5', evolution: '0' }),
      line({ zone: 'departement', code: '1', tonnes: '7', evolution: '0' }),
      line({ zone: 'departement', code: '75', tonnes: '2', evolution: '0' }),
    )._unsafeUnwrap()
    expect(departements).toEqual({
      csv: `${DEPARTEMENT_COLUMNS}\n01,7,7\n10,5,5\n75,2,2\n`,
      count: 3,
      previousCampaignTonnes: '14',
      latestCampaignTonnes: '14',
    })
  })

  it.each(['20', '99'])('écarte le code %s, qui ne se rattache à aucun département', (code) => {
    const { departements } = build(
      line({ zone: 'departement', code: '1', tonnes: '7', evolution: '0' }),
      line({ zone: 'departement', code, tonnes: '100', evolution: '0' }),
    )._unsafeUnwrap()
    expect(departements).toEqual({
      csv: `${DEPARTEMENT_COLUMNS}\n01,7,7\n`,
      count: 1,
      previousCampaignTonnes: '7',
      latestCampaignTonnes: '7',
    })
  })

  it('refuse un code de département vide', () => {
    expect(
      build(line({ zone: 'departement', code: '', tonnes: '7', evolution: '0' }))._unsafeUnwrapErr(),
    ).toEqual({
      kind: 'invalid_dataset',
      dataset: 'fertilisation-azotee/sources/unifa-azote-2023-2024.csv',
      reason: 'empty_key',
      detail: 'code',
    })
  })

  it('ne mélange pas les régions et les départements', () => {
    const { regions, departements } = build(
      line({ zone: 'region', code: '11', tonnes: '10', evolution: '0' }),
      line({ zone: 'departement', code: '1', tonnes: '7', evolution: '0' }),
    )._unsafeUnwrap()
    expect({ regions: regions.count, departements: departements.count }).toEqual({
      regions: 1,
      departements: 1,
    })
  })
})
