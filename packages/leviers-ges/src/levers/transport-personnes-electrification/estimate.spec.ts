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
import { estimate as estimateTransportPersonnesElectrification } from './estimate.ts'
import {
  transportPersonnesElectrificationRequestSchema,
  type TransportPersonnesElectrificationRequest,
} from './transport-personnes-electrification-request.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

type Parameters = {
  readonly carElectrificationFraction: string
  readonly busElectrificationFraction: string
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
  car_thermal_emission_factor_kg_per_km: '0.17',
  bus_thermal_emission_factor_kg_per_km: '0.8',
  car_thermal_fleet_share: '0.9',
  bus_thermal_fleet_share: '0.8',
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
  request: TransportPersonnesElectrificationRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportPersonnesElectrification(request, context)
}

const HALF_OF_FLEET: Parameters = {
  carElectrificationFraction: '0.5',
  busElectrificationFraction: '0.5',
}

function request(
  level: ComputedLevels<'transport_personnes_electrification'>,
  code: string,
  parameters: Parameters = HALF_OF_FLEET,
): TransportPersonnesElectrificationRequest {
  const parsed = transportPersonnesElectrificationRequestSchema.parse({
    id: 'transport_personnes_electrification',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(toFixtures({})))

describe('estimate, transport_personnes_electrification', () => {
  it.each([
    ['la région 84, hors Île-de-France : 24 % de ferré', request('region', '84'), '4313.97'],
    ['le département 01, hors Île-de-France', request('departement', '01'), '4313.97'],
    ['l’EPCI 200000001, hors Île-de-France', request('epci', '200000001'), '4313.97'],
    ['la région 11, Île-de-France : 82 % de ferré', request('region', '11'), '3247.97'],
    ['le département 75, Île-de-France', request('departement', '75'), '3247.97'],
    ['l’EPCI 200000002, Île-de-France', request('epci', '200000002'), '3247.97'],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('prend la part ferrée de la requête plutôt que celle par défaut : 60 % donnent 3 652,31 tCO2e', () => {
    const parameters = { ...HALF_OF_FLEET, railShareFraction: '0.6' }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '3652.31',
    )
  })

  it('plafonne chaque mode à sa part thermique : tout le parc demandé évite 7 485,78 tCO2e', () => {
    const parameters = { carElectrificationFraction: '1', busElectrificationFraction: '1' }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '7485.78',
    )
  })

  it('renvoie les parts plafonnées, mais pas celles qui tiennent dans le parc', () => {
    const capped = estimate(
      request('region', '84', { carElectrificationFraction: '1', busElectrificationFraction: '0.5' }),
    )._unsafeUnwrap().appliedAssumptions
    expect({
      car: capped['carElectrificationFraction']?.value,
      bus: capped['busElectrificationFraction'],
    }).toEqual({ car: '0.9', bus: undefined })
    expect(capped['carElectrificationFraction']?.limit).toContain('plafonnée')
  })

  it('renvoie la part ferrée par défaut avec sa limite, mais pas celle de la requête', () => {
    const defaulted = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions
    const requested = estimate(
      request('region', '84', { ...HALF_OF_FLEET, railShareFraction: '0.6' }),
    )._unsafeUnwrap().appliedAssumptions
    expect({
      defaulted: defaulted['railShare']?.value,
      requested: requested['railShare'],
    }).toEqual({ defaulted: '0.24', requested: undefined })
  })

  it('renvoie les facteurs d’émission de l’électrique', () => {
    const assumptions = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions
    expect({
      car: assumptions['electricCarEmissionFactor']?.value,
      bus: assumptions['electricBusEmissionFactor']?.value,
    }).toEqual({ car: '0.013345', bus: '0.095' })
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
      { regions: [transportRow('code_region', '84', { car_thermal_fleet_share: 'beaucoup' })] },
    ],
    [
      'département',
      'departement' as const,
      '01',
      {
        departements: [
          transportRow('code_departement', '01', { car_thermal_fleet_share: 'beaucoup' }),
        ],
      },
    ],
    [
      'EPCI',
      'epci' as const,
      '200000001',
      { epcis: [transportRow('code_epci', '200000001', { car_thermal_fleet_share: 'beaucoup' })] },
    ],
  ])('refuse une part thermique qui n’est pas un nombre pour une %s', (_label, level, code, fixtures) => {
    const broken = toEstimator(createTemporaryCsvDataSource(toFixtures(fixtures)))
    expect(broken(request(level, code))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
      detail: 'car_thermal_fleet_share=beaucoup is not a decimal number',
    })
  })
})
