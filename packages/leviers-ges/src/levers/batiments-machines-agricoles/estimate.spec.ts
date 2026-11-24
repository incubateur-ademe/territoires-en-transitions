import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { EstimationError } from '../../application/estimate/estimation-error.ts'
import type { DataRow, DataSource } from '../../domain/data-source.ts'
import type { Level } from '../../domain/territory.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import {
  batimentsMachinesAgricolesRequestSchema,
  type BatimentsMachinesAgricolesRequest,
  type BatimentsMachinesAgricolesRequestInput,
} from './batiments-machines-agricoles-request.ts'
import { estimate as estimateBatimentsMachinesAgricoles } from './estimate.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

type Reductions = BatimentsMachinesAgricolesRequestInput['parameters']

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '69001', code_epci: '200000002', code_departement: '69', code_region: '84' },
  { code_commune: '75056', code_epci: '', code_departement: '75', code_region: '11' },
  { code_commune: '2A004', code_epci: '', code_departement: '2A', code_region: '94' },
  { code_commune: '97101', code_epci: '', code_departement: '971', code_region: '01' },
]

const REGIONS: readonly DataRow[] = [
  {
    code_region: '84',
    electricity_gwh: '10',
    natural_gas_gwh: '4',
    petroleum_products_gwh: '100',
    heat_gwh: '20',
  },
  {
    code_region: '11',
    electricity_gwh: '1',
    natural_gas_gwh: '1',
    petroleum_products_gwh: '50',
    heat_gwh: '0',
  },
  {
    code_region: '94',
    electricity_gwh: '2',
    natural_gas_gwh: '0',
    petroleum_products_gwh: '100',
    heat_gwh: '5',
  },
]

const DEPARTEMENTS: readonly DataRow[] = [
  { code_departement: '01', electricity_mwh: '2000', natural_gas_mwh: '500' },
  { code_departement: '69', electricity_mwh: '3000', natural_gas_mwh: '600' },
  { code_departement: '75', electricity_mwh: '100', natural_gas_mwh: '50' },
  { code_departement: '2A', electricity_mwh: '100', natural_gas_mwh: '0' },
]

const EPCIS: readonly DataRow[] = [
  { code_epci: '200000001', electricity_mwh: '1500', natural_gas_mwh: '400' },
  { code_epci: '200000002', electricity_mwh: '3000', natural_gas_mwh: '600' },
]

const AREAS: readonly DataRow[] = [
  { code_commune: '01001', agricultural_area_ha: '100' },
  { code_commune: '01002', agricultural_area_ha: '300' },
  { code_commune: '69001', agricultural_area_ha: '600' },
  { code_commune: '75056', agricultural_area_ha: '50' },
  { code_commune: '2A004', agricultural_area_ha: '0' },
  { code_commune: '97101', agricultural_area_ha: '10' },
  { code_commune: '99999', agricultural_area_ha: '40' },
]

function network(commune: string, deliveredMwh: string, factor: string): DataRow {
  return {
    network_id: `${commune}-${deliveredMwh}`,
    commune_code: commune,
    delivered_mwh: deliveredMwh,
    emission_factor_kg_per_kwh: factor,
    emission_factor_source: 'fcu',
  }
}

const NETWORKS: readonly DataRow[] = [network('01001', '1000', '0.1'), network('69001', '500', '0.2')]

function toFixtures({
  communes = COMMUNES,
  regions = REGIONS,
  departements = DEPARTEMENTS,
  epcis = EPCIS,
  areas = AREAS,
  networks = NETWORKS,
}: {
  communes?: readonly DataRow[]
  regions?: readonly DataRow[]
  departements?: readonly DataRow[]
  epcis?: readonly DataRow[]
  areas?: readonly DataRow[]
  networks?: readonly DataRow[]
}): Fixtures {
  return {
    'territoires/communes': { keyColumn: 'code_commune', rows: communes },
    'batiments-machines-agricoles/regions': { keyColumn: 'code_region', level: 'region', rows: regions },
    'batiments-machines-agricoles/departements': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departements,
    },
    'batiments-machines-agricoles/epcis': { keyColumn: 'code_epci', level: 'epci', rows: epcis },
    'surface-agricole-utile/communes': { keyColumn: 'code_commune', rows: areas },
    'reseaux-chaleur/networks': { keyColumn: 'network_id', rows: networks },
  }
}

type Estimator = (
  request: BatimentsMachinesAgricolesRequest,
) => Result<EstimateResult, EstimationError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateBatimentsMachinesAgricoles(request, context)
}

const FULL: Reductions = {
  electricityReductionFraction: '1',
  naturalGasReductionFraction: '1',
  petroleumProductsReductionFraction: '1',
  heatReductionFraction: '1',
}

const NONE: Reductions = {
  electricityReductionFraction: '0',
  naturalGasReductionFraction: '0',
  petroleumProductsReductionFraction: '0',
  heatReductionFraction: '0',
}

function request(
  level: Level,
  code: string,
  parameters: Reductions = FULL,
): BatimentsMachinesAgricolesRequest {
  return batimentsMachinesAgricolesRequestSchema.parse({
    id: 'batiments_machines_agricoles',
    territory: { level, code },
    parameters,
  })
}

const estimate = toEstimator(createTemporaryCsvDataSource(toFixtures({})))

const estimateWithBrokenAreas = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({ areas: [{ code_commune: '01001', agricultural_area_ha: 'beaucoup' }] }),
  ),
)

const estimateWithBrokenNetworks = toEstimator(
  createTemporaryCsvDataSource(toFixtures({ networks: [network('01001', 'beaucoup', '0.1')] })),
)

const estimateWithBrokenRegions = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({
      regions: [
        {
          code_region: '84',
          electricity_gwh: 'beaucoup',
          natural_gas_gwh: '4',
          petroleum_products_gwh: '100',
          heat_gwh: '20',
        },
      ],
    }),
  ),
)

const estimateWithBrokenLocalEnergy = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({
      departements: [{ code_departement: '01', electricity_mwh: 'beaucoup', natural_gas_mwh: '500' }],
    }),
  ),
)

const estimateWithoutRegionalEnergy = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({
      regions: [
        {
          code_region: '11',
          electricity_gwh: '1',
          natural_gas_gwh: '1',
          petroleum_products_gwh: '50',
          heat_gwh: '0',
        },
      ],
    }),
  ),
)

const STRADDLING_COMMUNES: readonly DataRow[] = [
  { code_commune: 'A1', code_epci: 'E3', code_departement: '01', code_region: '84' },
  { code_commune: 'A2', code_epci: 'E4', code_departement: '01', code_region: '84' },
  { code_commune: 'B1', code_epci: 'E3', code_departement: '75', code_region: '11' },
  { code_commune: 'B2', code_epci: 'E5', code_departement: '75', code_region: '11' },
]

const estimateStraddling = toEstimator(
  createTemporaryCsvDataSource(
    toFixtures({
      communes: STRADDLING_COMMUNES,
      regions: [
        {
          code_region: '84',
          electricity_gwh: '0',
          natural_gas_gwh: '0',
          petroleum_products_gwh: '80',
          heat_gwh: '0',
        },
        {
          code_region: '11',
          electricity_gwh: '0',
          natural_gas_gwh: '0',
          petroleum_products_gwh: '40',
          heat_gwh: '0',
        },
      ],
      epcis: [{ code_epci: 'E3', electricity_mwh: '0', natural_gas_mwh: '0' }],
      areas: [
        { code_commune: 'A1', agricultural_area_ha: '100' },
        { code_commune: 'A2', agricultural_area_ha: '300' },
        { code_commune: 'B1', agricultural_area_ha: '100' },
        { code_commune: 'B2', agricultural_area_ha: '300' },
      ],
      networks: [network('A2', '1000', '0.1')],
    }),
  ),
)

describe('estimate, batiments_machines_agricoles', () => {
  it.each([
    ['la région 84', request('region', '84'), '30648.34'],
    ['la région 11, sans réseau de chaleur ni chaleur', request('region', '11'), '13649.75'],
    ['le département 01, avec 40 % de la SAU de la région', request('departement', '01'), '11701.43'],
    ['le département 69, avec 60 % de la SAU de la région', request('departement', '69'), '18721.96'],
    ['le département 75, sans réseau de chaleur', request('departement', '75'), '13427.16'],
    ['l’EPCI 200000001', request('epci', '200000001'), '11663.82'],
    ['l’EPCI 200000002', request('epci', '200000002'), '18721.96'],
  ])('évite pour %s à 100 % : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it.each([
    ['l’électricité', { ...NONE, electricityReductionFraction: '0.5' }, '174.9'],
    ['le gaz naturel', { ...NONE, naturalGasReductionFraction: '0.5' }, '402.34'],
    ['les produits pétroliers', { ...NONE, petroleumProductsReductionFraction: '0.5' }, '13413.6'],
    ['la chaleur', { ...NONE, heatReductionFraction: '0.5' }, '1333.33'],
    ['aucun vecteur', NONE, '0'],
  ])('dans la région 84, réduire seulement %s de moitié évite %s tCO2e', (_label, parameters, expected) => {
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      expected,
    )
  })

  it('un territoire sans réseau de chaleur garde les trois autres vecteurs et une chaleur nulle', () => {
    const heatOnly: Reductions = { ...NONE, heatReductionFraction: '1' }
    expect(estimate(request('departement', '75', heatOnly))._unsafeUnwrap().reduction.toFixed()).toBe('0')
  })

  it('un EPCI à cheval sur deux régions reçoit la part de SAU de chacune : 25 % de 80 GWh et 25 % de 40 GWh', () => {
    const petroleumOnly: Reductions = { ...NONE, petroleumProductsReductionFraction: '1' }
    expect(estimateStraddling(request('epci', 'E3', petroleumOnly))._unsafeUnwrap().reduction.toFixed()).toBe(
      '8048.16',
    )
  })

  it('une commune sans région dans la géographie ne compte pas dans la SAU régionale', () => {
    const petroleumOnly: Reductions = { ...NONE, petroleumProductsReductionFraction: '1' }
    expect(estimate(request('region', '84', petroleumOnly))._unsafeUnwrap().reduction.toFixed()).toBe('26827.2')
  })

  it('une région sans SAU garde son électricité et perd ses produits pétroliers et sa chaleur', () => {
    expect(estimate(request('region', '94'))._unsafeUnwrap().reduction.toFixed()).toBe('69.96')
  })

  it('un département sans SAU garde son électricité et perd les produits pétroliers et la chaleur de sa région', () => {
    expect(estimate(request('departement', '2A'))._unsafeUnwrap().reduction.toFixed()).toBe('3.5')
  })

  it('refuse un territoire inconnu', () => {
    expect(estimate(request('region', '99'))._unsafeUnwrapErr()).toEqual({
      kind: 'unknown_territory',
      level: 'region',
      code: '99',
    })
  })

  it('refuse une région absente des données énergétiques', () => {
    expect(estimate(request('region', '01'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'batiments-machines-agricoles/regions',
      key: '01',
    })
  })

  it('refuse un département absent des données énergétiques', () => {
    expect(estimate(request('departement', '971'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
      key: '971',
    })
  })

  it('refuse une région dont l’énergie manque pour répartir ses produits pétroliers', () => {
    expect(estimateWithoutRegionalEnergy(request('departement', '01'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'batiments-machines-agricoles/regions',
      key: '84',
    })
  })

  it('refuse une surface agricole qui n’est pas un nombre', () => {
    expect(estimateWithBrokenAreas(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'surface-agricole-utile/communes',
      reason: 'unreadable',
      detail: 'agricultural_area_ha=beaucoup is not a decimal number',
    })
  })

  it('refuse une livraison de chaleur qui n’est pas un nombre', () => {
    expect(estimateWithBrokenNetworks(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      dataset: 'reseaux-chaleur/networks',
      reason: 'unreadable',
    })
  })

  it('refuse une énergie régionale qui n’est pas un nombre', () => {
    expect(estimateWithBrokenRegions(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'batiments-machines-agricoles/regions',
      reason: 'unreadable',
      detail: 'electricity_gwh=beaucoup is not a decimal number',
    })
  })

  it('refuse une énergie locale qui n’est pas un nombre', () => {
    expect(estimateWithBrokenLocalEnergy(request('departement', '01'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'batiments-machines-agricoles/departements',
      reason: 'unreadable',
      detail: 'electricity_mwh=beaucoup is not a decimal number',
    })
  })
})
