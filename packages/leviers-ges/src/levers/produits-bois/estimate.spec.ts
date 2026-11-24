import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import { sum } from '../../domain/big-number.ts'
import type { DataSourceError, DataRow, DataSource } from '../../domain/data-source.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateProduitsBois } from './estimate.ts'
import { produitsBoisRequestSchema, type ProduitsBoisRequest } from './produits-bois-request.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

function wood(code: string, logs: string, industrialWood: string, key: string): DataRow {
  return { [key]: code, logs_thousand_m3: logs, industrial_wood_thousand_m3: industrialWood }
}

const REGIONS: readonly DataRow[] = [
  wood('84', '400', '100', 'code_region'),
  wood('11', '600', '400', 'code_region'),
]

const DEPARTEMENTS: readonly DataRow[] = [
  wood('01', '100', '25', 'code_departement'),
  wood('69', '300', '75', 'code_departement'),
  wood('75', '600', '400', 'code_departement'),
]

const CONSTANTS: readonly DataRow[] = [
  { name: 'national_logs_thousand_m3', value: '1000' },
  { name: 'national_industrial_wood_thousand_m3', value: '500' },
  { name: 'timber_products_carbon_tc', value: '1000' },
  { name: 'industrial_products_carbon_tc', value: '2000' },
]

function epciForest(epci: string, departement: string, hectares: string): DataRow {
  return {
    epci_departement: `${epci}-${departement}`,
    code_epci: epci,
    code_departement: departement,
    forest_hectares: hectares,
  }
}

const EPCI_FORESTS: readonly DataRow[] = [
  epciForest('200000001', '01', '50'),
  epciForest('200000002', '01', '100'),
  epciForest('200000002', '69', '30'),
  epciForest('200000003', '75', '0'),
]

const DEPARTEMENT_FORESTS: readonly DataRow[] = [
  { code_departement: '01', forest_hectares: '200' },
  { code_departement: '69', forest_hectares: '60' },
  { code_departement: '75', forest_hectares: '0' },
]

function toFixtures({
  regions = REGIONS,
  departements = DEPARTEMENTS,
  constants = CONSTANTS,
  epciForests = EPCI_FORESTS,
  departementForests = DEPARTEMENT_FORESTS,
}: {
  regions?: readonly DataRow[]
  departements?: readonly DataRow[]
  constants?: readonly DataRow[]
  epciForests?: readonly DataRow[]
  departementForests?: readonly DataRow[]
}): Fixtures {
  return {
    'produits-bois/regions': { keyColumn: 'code_region', level: 'region', rows: regions },
    'produits-bois/departements': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departements,
    },
    'produits-bois/constants': { keyColumn: 'name', rows: constants },
    'produits-bois/foret-epci-departement': { keyColumn: 'epci_departement', rows: epciForests },
    'produits-bois/foret-departement': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departementForests,
    },
  }
}

type Estimator = (request: ProduitsBoisRequest) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateProduitsBois(request, context)
}

function request(
  level: ComputedLevels<'produits_bois'>,
  code: string,
  increase = '0.12',
): ProduitsBoisRequest {
  const parsed = produitsBoisRequestSchema.parse({
    id: 'produits_bois',
    territory: { level, code },
    parameters: { woodProductionIncrease: increase },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(toFixtures({})))

const estimateWithBrokenTerritory = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({ regions: [wood('84', 'beaucoup', '100', 'code_region')] }),
  ),
)

function estimateWith(fixtures: Parameters<typeof toFixtures>[0]): Estimator {
  return toEstimator(createTemporaryCsvDataSource(toFixtures(fixtures)))
}

const estimateWithBrokenConstant = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({ constants: [{ name: 'national_logs_thousand_m3', value: 'beaucoup' }] }),
  ),
)

const estimateWithMissingConstant = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({ constants: [{ name: 'national_logs_thousand_m3', value: '1000' }] }),
  ),
)

describe('estimate, produits_bois', () => {
  it.each([
    ['la région 84 : 40 % des grumes et 20 % du bois d’industrie', request('region', '84'), '352'],
    ['la région 11 : 60 % des grumes et 80 % du bois d’industrie', request('region', '11'), '968'],
    ['le département 01', request('departement', '01'), '88'],
    ['le département 69', request('departement', '69'), '264'],
    ['le département 75', request('departement', '75'), '968'],
    ['la région 84 à +100 %', request('region', '84', '1'), '2933.33'],
    ['la région 84 à -12 %', request('region', '84', '-0.12'), '-352'],
    ['la région 84 à 0 %', request('region', '84', '0'), '0'],
    ['l’EPCI 200000001 : le quart de la forêt du département 01', request('epci', '200000001'), '22'],
    ['l’EPCI 200000002, à cheval sur les départements 01 et 69', request('epci', '200000002'), '176'],
    ['l’EPCI 200000003, dans un département sans forêt', request('epci', '200000003'), '0'],
  ])('stocke pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('les deux régions retrouvent le national : 352 + 968 = 11 000 × 12 % = 1 320 tCO2e', () => {
    const regionsStorage = ['84', '11'].map(
      (code) => estimate(request('region', code))._unsafeUnwrap().reduction,
    )
    expect(sum(regionsStorage).toFixed()).toBe('1320')
  })

  it('refuse une région absente des données', () => {
    expect(estimate(request('region', '99'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'produits-bois/regions',
      key: '99',
    })
  })

  it('refuse un département absent des données', () => {
    expect(estimate(request('departement', '99'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'produits-bois/departements',
      key: '99',
    })
  })

  it('refuse une récolte qui n’est pas un nombre', () => {
    expect(estimateWithBrokenTerritory(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/regions',
      reason: 'unreadable',
      detail: 'logs_thousand_m3=beaucoup is not a decimal number',
    })
  })

  it('refuse une constante nationale qui n’est pas un nombre', () => {
    expect(estimateWithBrokenConstant(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/constants',
      reason: 'unreadable',
      detail: 'national_logs_thousand_m3=beaucoup is not a decimal number',
    })
  })

  it('refuse une constante nationale absente', () => {
    expect(estimateWithMissingConstant(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'produits-bois/constants',
      key: 'national_industrial_wood_thousand_m3',
    })
  })

  it('un EPCI qui couvre toute la forêt de son département retrouve ce département : 88 tCO2e', () => {
    const fullEpci = estimateWith({ epciForests: [epciForest('200000009', '01', '200')] })
    expect(fullEpci(request('epci', '200000009'))._unsafeUnwrap().reduction.toFixed()).toBe(
      estimate(request('departement', '01'))._unsafeUnwrap().reduction.toFixed(),
    )
  })

  it('refuse un EPCI absent des surfaces de forêt', () => {
    expect(estimate(request('epci', '999999999'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'produits-bois/foret-epci-departement',
      key: '999999999',
    })
  })

  it('refuse un EPCI dont un département n’a pas de surface de forêt', () => {
    const withoutDepartementForest = estimateWith({
      departementForests: [{ code_departement: '69', forest_hectares: '60' }],
    })
    expect(withoutDepartementForest(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'produits-bois/foret-departement',
      key: '01',
    })
  })

  it('refuse un EPCI dont un département n’a pas de récolte', () => {
    const withoutProduction = estimateWith({ departements: [DEPARTEMENTS[1] ?? {}] })
    expect(withoutProduction(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'produits-bois/departements',
      key: '01',
    })
  })

  it('refuse une surface de forêt d’EPCI qui n’est pas un nombre', () => {
    const broken = estimateWith({ epciForests: [epciForest('200000001', '01', 'beaucoup')] })
    expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/foret-epci-departement',
      reason: 'unreadable',
      detail: 'forest_hectares=beaucoup is not a decimal number',
    })
  })

  it('refuse un département d’EPCI vide', () => {
    const broken = estimateWith({ epciForests: [epciForest('200000001', '', '50')] })
    expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/foret-epci-departement',
      reason: 'empty_key',
    })
  })

  it('refuse une surface de forêt départementale qui n’est pas un nombre', () => {
    const broken = estimateWith({
      departementForests: [{ code_departement: '01', forest_hectares: 'beaucoup' }],
    })
    expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
      dataset: 'produits-bois/foret-departement',
      reason: 'unreadable',
    })
  })

  it('refuse une forêt d’EPCI supérieure à celle de son département', () => {
    const inconsistent = estimateWith({ epciForests: [epciForest('200000001', '01', '201')] })
    expect(inconsistent(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'produits-bois/foret-epci-departement',
      reason: 'control_total_mismatch',
      detail: "01: forest_hectares=201 exceeds the department's 200",
    })
  })

  it('refuse une forêt d’EPCI dans un département sans forêt', () => {
    const inconsistent = estimateWith({ epciForests: [epciForest('200000003', '75', '1')] })
    expect(inconsistent(request('epci', '200000003'))._unsafeUnwrapErr()).toMatchObject({
      reason: 'control_total_mismatch',
    })
  })
})
