import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataRow, DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateTransportPersonnesEfficacite } from './estimate.ts'
import {
  transportPersonnesEfficaciteRequestSchema,
  type TransportPersonnesEfficaciteRequest,
} from './transport-personnes-efficacite-request.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

type Parameters = {
  readonly carEcodrivingApplicationFraction: string
  readonly busEcodrivingApplicationFraction: string
  readonly carPassengerIncrease: string
  readonly busPassengerIncrease: string
  readonly railShareFraction?: string
}

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '75056', code_epci: '200000002', code_departement: '75', code_region: '11' },
]

const TRANSPORT_VALUES = {
  car_weekly_passenger_km: '1000000',
  public_transport_weekly_passenger_km: '1000000',
  car_emission_factor_kg_per_km: '0.1165',
  bus_emission_factor_kg_per_km: '0.8',
  car_fleet_unclassified_share: '0',
  bus_fleet_unclassified_share: '0',
  car_fleet_classified: '100',
  bus_fleet_classified: '100',
}

function transportRow(keyColumn: string, code: string, overrides: DataRow = {}): DataRow {
  return { [keyColumn]: code, ...TRANSPORT_VALUES, ...overrides }
}

function toFixtures({
  regions = [transportRow('code_region', '84'), transportRow('code_region', '11')],
  departements = [transportRow('code_departement', '01'), transportRow('code_departement', '75')],
  epcis = [transportRow('code_epci', '200000001'), transportRow('code_epci', '200000002')],
}: {
  regions?: readonly DataRow[]
  departements?: readonly DataRow[]
  epcis?: readonly DataRow[]
}): Fixtures {
  return {
    'territoires/communes': { keyColumn: 'code_commune', rows: COMMUNES },
    'transport-personnes/regions': { keyColumn: 'code_region', level: 'region', rows: regions },
    'transport-personnes/departements': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departements,
    },
    'transport-personnes/epcis': { keyColumn: 'code_epci', level: 'epci', rows: epcis },
  }
}

type Estimator = (
  request: TransportPersonnesEfficaciteRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportPersonnesEfficacite(request, context)
}

const ECODRIVING_ONLY: Parameters = {
  carEcodrivingApplicationFraction: '1',
  busEcodrivingApplicationFraction: '1',
  carPassengerIncrease: '0',
  busPassengerIncrease: '0',
}

function request(
  level: ComputedLevels<'transport_personnes_efficacite'>,
  code: string,
  parameters: Parameters = ECODRIVING_ONLY,
): TransportPersonnesEfficaciteRequest {
  const parsed = transportPersonnesEfficaciteRequestSchema.parse({
    id: 'transport_personnes_efficacite',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(toFixtures({})))

describe('estimate, transport_personnes_efficacite', () => {
  it.each([
    ['la région 84, hors Île-de-France : 24 % de ferré', request('region', '84'), '750.89'],
    ['le département 01, hors Île-de-France', request('departement', '01'), '750.89'],
    ['l’EPCI 200000001, hors Île-de-France', request('epci', '200000001'), '750.89'],
    ['la région 11, Île-de-France : 82 % de ferré', request('region', '11'), '508.96'],
    ['le département 75, Île-de-France', request('departement', '75'), '508.96'],
    ['l’EPCI 200000002, Île-de-France', request('epci', '200000002'), '508.96'],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('prend la part ferrée de la requête plutôt que celle par défaut : 60 % donnent 600,73 tCO2e', () => {
    const parameters = { ...ECODRIVING_ONLY, railShareFraction: '0.6' }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '600.73',
    )
  })

  it('applique à chaque mode ses propres paramètres : voiture 100 % et +10 %, bus 50 % et +20 %', () => {
    const parameters = {
      carEcodrivingApplicationFraction: '1',
      busEcodrivingApplicationFraction: '0.5',
      carPassengerIncrease: '0.1',
      busPassengerIncrease: '0.2',
    }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '1449.31',
    )
  })

  it('ne réduit rien sans écoconduite ni passagers en plus', () => {
    const parameters = {
      carEcodrivingApplicationFraction: '0',
      busEcodrivingApplicationFraction: '0',
      carPassengerIncrease: '0',
      busPassengerIncrease: '0',
    }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe('0')
  })

  it('renvoie la part ferrée par défaut avec sa limite, mais pas celle de la requête', () => {
    const defaulted = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions
    const requested = estimate(
      request('region', '84', { ...ECODRIVING_ONLY, railShareFraction: '0.6' }),
    )._unsafeUnwrap().appliedAssumptions
    expect({
      defaulted: defaulted['railShare']?.value,
      requested: requested['railShare'],
    }).toEqual({ defaulted: '0.24', requested: undefined })
    expect(defaulted['railShare']?.limit).toContain('grand réseau de métro ou de tramway')
  })

  it('renvoie le facteur du bus retenu et le potentiel d’écoconduite', () => {
    const assumptions = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions
    expect({
      busEmissionFactor: assumptions['busEmissionFactor']?.value,
      ecodrivingPotential: assumptions['ecodrivingPotential']?.value,
    }).toEqual({ busEmissionFactor: '0.08', ecodrivingPotential: '0.1' })
  })

  it('renvoie la moyenne nationale appliquée à un EPCI sans bus classé', () => {
    const withoutBus = toEstimator(
      createTemporaryCsvDataSource(
        toFixtures({
          epcis: [
            transportRow('code_epci', '200000001', { bus_fleet_classified: '0' }),
            transportRow('code_epci', '200000002'),
          ],
        }),
      ),
    )
    const assumptions = withoutBus(request('epci', '200000001'))._unsafeUnwrap().appliedAssumptions
    expect(assumptions['nationalBusEmissionFactor']?.value).toBe('0.08')
  })

  it.each([
    ['une région absente des données', request('region', '99')],
    ['un département absent des données', request('departement', '99')],
    ['un EPCI absent des données', request('epci', '999999999')],
  ])('refuse %s', (_label, input) => {
    expect(estimate(input)._unsafeUnwrapErr()).toMatchObject({ kind: 'unknown_territory' })
  })

  it.each([
    ['region', 'transport-personnes/regions', { regions: [transportRow('code_region', '11')] }, '84'],
    [
      'departement',
      'transport-personnes/departements',
      { departements: [transportRow('code_departement', '75')] },
      '01',
    ],
    ['epci', 'transport-personnes/epcis', { epcis: [transportRow('code_epci', '200000002')] }, '200000001'],
  ] as const)(
    'refuse un territoire de niveau %s connu de la géographie et absent du jeu',
    (level, dataset, fixtures, code) => {
      const withoutTerritory = toEstimator(createTemporaryCsvDataSource(toFixtures(fixtures)))
      expect(withoutTerritory(request(level, code))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset,
        key: code,
      })
    },
  )

  it.each([
    [
      'région',
      'region' as const,
      '84',
      { regions: [transportRow('code_region', '84', { bus_emission_factor_kg_per_km: 'beaucoup' })] },
    ],
    [
      'département',
      'departement' as const,
      '01',
      {
        departements: [
          transportRow('code_departement', '01', { bus_emission_factor_kg_per_km: 'beaucoup' }),
        ],
      },
    ],
    [
      'EPCI',
      'epci' as const,
      '200000001',
      { epcis: [transportRow('code_epci', '200000001', { bus_emission_factor_kg_per_km: 'beaucoup' })] },
    ],
  ])('refuse un facteur de bus qui n’est pas un nombre pour une %s', (_label, level, code, fixtures) => {
    const broken = toEstimator(createTemporaryCsvDataSource(toFixtures(fixtures)))
    expect(broken(request(level, code))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
      detail: 'bus_emission_factor_kg_per_km=beaucoup is not a decimal number',
    })
  })
})
