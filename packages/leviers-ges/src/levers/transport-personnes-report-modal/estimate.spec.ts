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
import { estimate as estimateTransportPersonnesReportModal } from './estimate.ts'
import {
  transportPersonnesReportModalRequestSchema,
  type TransportPersonnesReportModalRequest,
} from './transport-personnes-report-modal-request.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

type Parameters = {
  readonly carToPublicTransportFraction: string
  readonly carToActiveModesFraction: string
  readonly publicTransportToActiveModesFraction: string
  readonly railShareFraction?: string
}

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '75056', code_epci: '200000002', code_departement: '75', code_region: '11' },
  { code_commune: '2A004', code_epci: '200000003', code_departement: '2A', code_region: '94' },
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
  car_thermal_emission_factor_kg_per_km: '0.1165',
  bus_thermal_emission_factor_kg_per_km: '0.8',
  car_thermal_fleet_share: '1',
  bus_thermal_fleet_share: '1',
}

function transportRow(keyColumn: string, code: string, overrides: DataRow = {}): DataRow {
  return { [keyColumn]: code, ...TRANSPORT_VALUES, ...overrides }
}

function toFixtures({
  regions = [
    transportRow('code_region', '84'),
    transportRow('code_region', '11'),
    transportRow('code_region', '94'),
  ],
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
  request: TransportPersonnesReportModalRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportPersonnesReportModal(request, context)
}

const MIXED_SHIFT: Parameters = {
  carToPublicTransportFraction: '0.1',
  carToActiveModesFraction: '0.05',
  publicTransportToActiveModesFraction: '0',
}

function request(
  level: ComputedLevels<'transport_personnes_report_modal'>,
  code: string,
  parameters: Parameters = MIXED_SHIFT,
): TransportPersonnesReportModalRequest {
  const parsed = transportPersonnesReportModalRequestSchema.parse({
    id: 'transport_personnes_report_modal',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(toFixtures({})))

describe('estimate, transport_personnes_report_modal', () => {
  it.each([
    ['la région 84, hors Île-de-France : 24 % de ferré', request('region', '84'), '314.49'],
    ['le département 01, hors Île-de-France', request('departement', '01'), '314.49'],
    ['l’EPCI 200000001, hors Île-de-France', request('epci', '200000001'), '314.49'],
    ['la région 11, Île-de-France : 82 % de ferré', request('region', '11'), '509.75'],
    ['le département 75, Île-de-France', request('departement', '75'), '509.75'],
    ['l’EPCI 200000002, Île-de-France', request('epci', '200000002'), '509.75'],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('prend la part ferrée de la requête plutôt que celle par défaut : 60 % donnent 435,69 tCO2e', () => {
    const parameters = { ...MIXED_SHIFT, railShareFraction: '0.6' }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '435.69',
    )
  })

  it('prend le facteur du train de Corse pour la région 94 : 99,8 tCO2e', () => {
    const result = estimate(request('region', '94'))._unsafeUnwrap()
    expect({
      reduction: result.reduction.toFixed(),
      railEmissionFactor: result.appliedAssumptions['railEmissionFactor']?.value,
    }).toEqual({ reduction: '99.8', railEmissionFactor: '0.187' })
  })

  it('ne compte que les modes actifs quand rien ne va vers les transports en commun : 216,94 tCO2e', () => {
    const parameters = {
      carToPublicTransportFraction: '0',
      carToActiveModesFraction: '0.05',
      publicTransportToActiveModesFraction: '0',
    }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '216.94',
    )
  })

  it('renvoie la part ferrée par défaut, mais pas celle de la requête', () => {
    const defaulted = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions
    const requested = estimate(
      request('region', '84', { ...MIXED_SHIFT, railShareFraction: '0.6' }),
    )._unsafeUnwrap().appliedAssumptions
    expect({
      defaulted: defaulted['railShare']?.value,
      requested: requested['railShare'],
    }).toEqual({ defaulted: '0.24', requested: undefined })
  })

  it('renvoie le facteur du ferré continental et celui du bus', () => {
    const assumptions = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions
    expect({
      rail: assumptions['railEmissionFactor']?.value,
      bus: assumptions['busEmissionFactor']?.value,
    }).toEqual({ rail: '0.0154346', bus: '0.08' })
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

  it('refuse un total de reports supérieur à 100 %', () => {
    const parsed = transportPersonnesReportModalRequestSchema.safeParse({
      id: 'transport_personnes_report_modal',
      territory: { level: 'region', code: '84' },
      parameters: {
        carToPublicTransportFraction: '0.7',
        carToActiveModesFraction: '0.4',
        publicTransportToActiveModesFraction: '0',
      },
    })
    expect(parsed.success).toBe(false)
  })
})
