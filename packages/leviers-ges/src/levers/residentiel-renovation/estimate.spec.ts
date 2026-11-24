import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { DataRow } from '../../domain/data-source.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  residentielRenovationRequestSchema,
  type ResidentielRenovationRequest,
} from './residentiel-renovation-request.ts'

type Level = ComputedLevels<'residentiel_renovation'>

type Surfaces = Readonly<Record<string, { readonly eligible: string; readonly notEligible: string }>>

const FUELS = ['electricity', 'natural_gas', 'fuel_oil', 'lpg', 'heat_network']

const ALL_CELLS = [
  'house_before_1971',
  'house_1971_to_2005',
  'house_after_2005',
  'private_apartment_before_1971',
  'private_apartment_1971_to_2005',
  'private_apartment_after_2005',
  'social_apartment_before_1971',
  'social_apartment_1971_to_2005',
  'social_apartment_after_2005',
]

function housing(surfaces: Surfaces): DataRow {
  const cells = FUELS.flatMap((fuel) =>
    ALL_CELLS.map((cell): [string, string] => {
      const { eligible = '0', notEligible = '0' } = surfaces[fuel] ?? {}
      const isEligible = cell === 'house_before_1971'
      const isNotEligible = cell === 'private_apartment_after_2005'
      return [`housing_m2_${cell.replace(/^(house|private_apartment|social_apartment)/, `$1_${fuel}`)}`, isEligible ? eligible : isNotEligible ? notEligible : '0']
    }),
  )
  return Object.fromEntries(cells)
}

const DEPARTEMENT_01 = housing({
  electricity: { eligible: '300', notEligible: '100' },
  natural_gas: { eligible: '50', notEligible: '50' },
  fuel_oil: { eligible: '100', notEligible: '0' },
  heat_network: { eligible: '0', notEligible: '200' },
})

const DEPARTEMENT_69 = housing({
  electricity: { eligible: '100', notEligible: '300' },
  natural_gas: { eligible: '50', notEligible: '50' },
  fuel_oil: { eligible: '100', notEligible: '0' },
  heat_network: { eligible: '0', notEligible: '200' },
})

function fixtures({
  departementHousing = [
    { code_departement: '01', ...DEPARTEMENT_01 },
    { code_departement: '69', ...DEPARTEMENT_69 },
  ],
}: {
  departementHousing?: readonly DataRow[]
}): Readonly<Record<string, DatasetFixture>> {
  return {
    'territoires/communes': {
      keyColumn: 'code_commune',
      rows: [
        { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
        { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
        { code_commune: '69001', code_epci: '200000002', code_departement: '69', code_region: '84' },
      ],
    },
    'residentiel-sobriete/regions': {
      keyColumn: 'code_region',
      level: 'region',
      rows: [
        {
          code_region: '84',
          electricity_gwh: '10',
          natural_gas_gwh: '4',
          fuel_oil_gwh: '20',
          lpg_gwh: '5',
          heat_gwh: '3',
        },
      ],
    },
    'residentiel-sobriete/departements': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: [
        {
          code_departement: '01',
          electricity_mwh: '2000',
          natural_gas_mwh: '500',
          fuel_oil_mwh: '1000',
          lpg_mwh: '400',
        },
      ],
    },
    'residentiel-sobriete/epcis': {
      keyColumn: 'code_epci',
      level: 'epci',
      rows: [{ code_epci: '200000001', electricity_mwh: '2000', natural_gas_mwh: '500' }],
    },
    'residentiel-sobriete/heat-networks': {
      keyColumn: 'network_id',
      rows: [
        { network_id: 'A', commune_code: '01001', delivered_mwh: '1000', emission_factor_kg_per_kwh: '0.1' },
        { network_id: 'B', commune_code: '69001', delivered_mwh: '500', emission_factor_kg_per_kwh: '0.2' },
        { network_id: 'C', commune_code: '01002', delivered_mwh: '3000', emission_factor_kg_per_kwh: '0.2' },
      ],
    },
    'residentiel-logements/logements-departement': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departementHousing,
    },
    'residentiel-logements/logements-epci-departement': {
      keyColumn: 'epci_departement',
      rows: [
        {
          epci_departement: '200000001-01',
          code_epci: '200000001',
          code_departement: '01',
          ...DEPARTEMENT_01,
        },
      ],
    },
  }
}

function request(level: Level, code: string): ResidentielRenovationRequest {
  const parsed = residentielRenovationRequestSchema.parse({
    id: 'residentiel_renovation',
    territory: { level, code },
    parameters: { renovatedParcFraction: '0.5' },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const context = createEstimationContext(createTemporaryCsvDataSource(fixtures({})))

describe('estimate, residentiel_renovation', () => {
  it.each([
    ['le département 01', 'departement', '01', '59.39'],
    ['l’EPCI 200000001, qui couvre tout le département 01', 'epci', '200000001', '59.39'],
    ['la région 84, parc des départements 01 et 69 additionné', 'region', '84', '1018.45'],
  ] as const)('évite pour %s : %s tCO2e par an à 50 %% du parc rénové', (_label, level, code, expected) => {
    expect(estimate(request(level, code), context)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('déclare la part nationale et l’exclusion des appartements d’après 1971', () => {
    const { appliedAssumptions } = estimate(request('departement', '01'), context)._unsafeUnwrap()
    expect(Object.keys(appliedAssumptions)).toEqual(['nationalHeatingShares', 'flatsAfter1971Excluded'])
  })

  it('refuse un département sans surface de logements', () => {
    const without = createEstimationContext(createTemporaryCsvDataSource(fixtures({ departementHousing: [{ code_departement: '69', ...DEPARTEMENT_69 }] })))
    expect(estimate(request('departement', '01'), without)._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'residentiel-logements/logements-departement',
      key: '01',
    })
  })

  it('refuse une région dont un département n’a pas de surface de logements', () => {
    const partial = createEstimationContext(
      createTemporaryCsvDataSource(
        fixtures({ departementHousing: [{ code_departement: '01', ...DEPARTEMENT_01 }] }),
      ),
    )
    expect(estimate(request('region', '84'), partial)._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
      key: '69',
    })
  })

  it('refuse un EPCI sans surface de logements', () => {
    expect(estimate(request('epci', '200000002'), context)._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
    })
  })

  it('refuse une surface qui n’est pas un nombre', () => {
    const broken = createEstimationContext(
      createTemporaryCsvDataSource(
        fixtures({
          departementHousing: [{ code_departement: '01', ...DEPARTEMENT_01, housing_m2_house_electricity_before_1971: 'beaucoup' }],
        }),
      ),
    )
    expect(estimate(request('departement', '01'), broken)._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
    })
  })
})
