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
import { estimate as estimateResidentielSobriete } from './estimate.ts'
import {
  residentielSobrieteRequestSchema,
  type ResidentielSobrieteRequest,
} from './residentiel-sobriete-request.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

type Parameters = {
  readonly householdsApplyingSobrietyFraction: string
  readonly consumptionReductionFraction: string
}

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '69001', code_epci: '200000002', code_departement: '69', code_region: '84' },
  { code_commune: '01003', code_epci: '200000003', code_departement: '01', code_region: '84' },
  { code_commune: '69002', code_epci: '200000003', code_departement: '69', code_region: '84' },
  { code_commune: '75056', code_epci: '', code_departement: '75', code_region: '11' },
]

const REGIONS: readonly DataRow[] = [
  {
    code_region: '84',
    electricity_gwh: '10',
    natural_gas_gwh: '4',
    fuel_oil_gwh: '20',
    lpg_gwh: '5',
    heat_gwh: '3',
  },
  {
    code_region: '11',
    electricity_gwh: '1',
    natural_gas_gwh: '1',
    fuel_oil_gwh: '0.5',
    lpg_gwh: '0.1',
    heat_gwh: '0',
  },
]

const DEPARTEMENTS: readonly DataRow[] = [
  {
    code_departement: '01',
    electricity_mwh: '2000',
    natural_gas_mwh: '500',
    fuel_oil_mwh: '1000',
    lpg_mwh: '400',
  },
  {
    code_departement: '69',
    electricity_mwh: '3000',
    natural_gas_mwh: '600',
    fuel_oil_mwh: '800',
    lpg_mwh: '200',
  },
  {
    code_departement: '75',
    electricity_mwh: '100',
    natural_gas_mwh: '50',
    fuel_oil_mwh: '10',
    lpg_mwh: '5',
  },
]

const EPCIS: readonly DataRow[] = [
  { code_epci: '200000001', electricity_mwh: '2000', natural_gas_mwh: '500' },
  { code_epci: '200000002', electricity_mwh: '1000', natural_gas_mwh: '100' },
  { code_epci: '200000003', electricity_mwh: '1500', natural_gas_mwh: '300' },
]

const HOUSING_TYPES = ['house', 'private_apartment', 'social_apartment']

const CONSTRUCTION_PERIODS = ['before_1971', '1971_to_2005', 'after_2005']

function housingSurfaces({ fuelOil, lpg }: { fuelOil: string; lpg: string }): DataRow {
  const columns = HOUSING_TYPES.flatMap((type) =>
    CONSTRUCTION_PERIODS.flatMap((period): [string, string][] => [
      [`housing_m2_${type}_fuel_oil_${period}`, '0'],
      [`housing_m2_${type}_lpg_${period}`, '0'],
    ]),
  )
  const zeros: Record<string, string> = Object.fromEntries(columns)
  return {
    ...zeros,
    housing_m2_house_fuel_oil_before_1971: fuelOil,
    housing_m2_social_apartment_lpg_after_2005: lpg,
  }
}

function epciHousing({
  epci,
  departement,
  fuelOil,
  lpg,
}: {
  epci: string
  departement: string
  fuelOil: string
  lpg: string
}): DataRow {
  return {
    epci_departement: `${epci}-${departement}`,
    code_epci: epci,
    code_departement: departement,
    ...housingSurfaces({ fuelOil, lpg }),
  }
}

const EPCI_HOUSING: readonly DataRow[] = [
  epciHousing({ epci: '200000001', departement: '01', fuelOil: '400', lpg: '200' }),
  epciHousing({ epci: '200000002', departement: '69', fuelOil: '100', lpg: '50' }),
  epciHousing({ epci: '200000003', departement: '01', fuelOil: '100', lpg: '100' }),
  epciHousing({ epci: '200000003', departement: '69', fuelOil: '100', lpg: '25' }),
]

const DEPARTEMENT_HOUSING: readonly DataRow[] = [
  { code_departement: '01', ...housingSurfaces({ fuelOil: '400', lpg: '200' }) },
  { code_departement: '69', ...housingSurfaces({ fuelOil: '400', lpg: '100' }) },
  { code_departement: '75', ...housingSurfaces({ fuelOil: '0', lpg: '0' }) },
]

function network(id: string, commune: string, deliveredMwh: string, factor: string): DataRow {
  return {
    network_id: id,
    commune_code: commune,
    delivered_mwh: deliveredMwh,
    emission_factor_kg_per_kwh: factor,
  }
}

const NETWORKS: readonly DataRow[] = [
  network('A', '01001', '1000', '0.1'),
  network('B', '69001', '500', '0.2'),
  network('C', '01002', '3000', '0.2'),
]

function toFixtures({
  communes = COMMUNES,
  regions = REGIONS,
  departements = DEPARTEMENTS,
  networks = NETWORKS,
  epcis = EPCIS,
  epciHousingRows = EPCI_HOUSING,
  departementHousing = DEPARTEMENT_HOUSING,
}: {
  communes?: readonly DataRow[]
  regions?: readonly DataRow[]
  departements?: readonly DataRow[]
  networks?: readonly DataRow[]
  epcis?: readonly DataRow[]
  epciHousingRows?: readonly DataRow[]
  departementHousing?: readonly DataRow[]
}): Fixtures {
  return {
    'territoires/communes': { keyColumn: 'code_commune', rows: communes },
    'residentiel-sobriete/regions': { keyColumn: 'code_region', level: 'region', rows: regions },
    'residentiel-sobriete/departements': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departements,
    },
    'residentiel-sobriete/heat-networks': { keyColumn: 'network_id', rows: networks },
    'residentiel-sobriete/epcis': { keyColumn: 'code_epci', level: 'epci', rows: epcis },
    'residentiel-logements/logements-epci-departement': {
      keyColumn: 'epci_departement',
      rows: epciHousingRows,
    },
    'residentiel-logements/logements-departement': {
      keyColumn: 'code_departement',
      level: 'departement',
      rows: departementHousing,
    },
  }
}

type Estimator = (
  request: ResidentielSobrieteRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateResidentielSobriete(request, context)
}

const FULL: Parameters = {
  householdsApplyingSobrietyFraction: '1',
  consumptionReductionFraction: '1',
}

function request(
  level: ComputedLevels<'residentiel_sobriete'>,
  code: string,
  parameters: Parameters = FULL,
): ResidentielSobrieteRequest {
  const parsed = residentielSobrieteRequestSchema.parse({
    id: 'residentiel_sobriete',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(toFixtures({})))

describe('estimate, residentiel_sobriete', () => {
  it.each([
    ['la région 84, chaleur pondérée par les trois réseaux de la région', request('region', '84'), '8189.05'],
    ['la région 11, sans réseau de chaleur', request('region', '11'), '393'],
    ['le département 01, chaleur des réseaux A et C', request('departement', '01'), '1229.68'],
    ['le département 69, chaleur du réseau B', request('departement', '69'), '585.69'],
    ['le département 75, sans réseau de chaleur', request('departement', '75'), '17.37'],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('applique la part des foyers puis la baisse : 50 % × 10 % de la région 84', () => {
    const parameters = {
      householdsApplyingSobrietyFraction: '0.5',
      consumptionReductionFraction: '0.1',
    }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe(
      '409.45',
    )
  })

  it('la chaleur du département est la somme des livraisons de ses réseaux, celle de la région vient du bilan', () => {
    const withoutNetworks = toEstimator(createTemporaryCsvDataSource(toFixtures({ networks: [network('Z', '75056', '1', '0')] })))
    expect({
      department: withoutNetworks(request('departement', '01'))._unsafeUnwrap().reduction.toFixed(),
      region: withoutNetworks(request('region', '84'))._unsafeUnwrap().reduction.toFixed(),
    }).toEqual({ department: '529.68', region: '7655.72' })
  })

  it('ne réduit rien à 0 % des foyers', () => {
    const parameters = {
      householdsApplyingSobrietyFraction: '0',
      consumptionReductionFraction: '1',
    }
    expect(estimate(request('region', '84', parameters))._unsafeUnwrap().reduction.toFixed()).toBe('0')
  })

  it.each([
    ['une région absente des données', request('region', '99')],
    ['un département absent des données', request('departement', '99')],
  ])('refuse %s', (_label, input) => {
    expect(estimate(input)._unsafeUnwrapErr()).toMatchObject({ kind: 'unknown_territory' })
  })

  it('refuse une région connue de la géographie et absente du jeu', () => {
    const withoutRegion = toEstimator(
      createTemporaryCsvDataSource(toFixtures({ regions: REGIONS.slice(1) })),
    )
    expect(withoutRegion(request('region', '84'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'residentiel-sobriete/regions',
      key: '84',
    })
  })

  it('refuse un département connu de la géographie et absent du jeu', () => {
    const withoutDepartment = toEstimator(
      createTemporaryCsvDataSource(toFixtures({ departements: DEPARTEMENTS.slice(1) })),
    )
    expect(withoutDepartment(request('departement', '01'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'residentiel-sobriete/departements',
      key: '01',
    })
  })

  it('refuse une consommation régionale qui n’est pas un nombre', () => {
    const broken = toEstimator(
      createTemporaryCsvDataSource(
        toFixtures({ regions: [{ ...REGIONS[0], lpg_gwh: 'beaucoup' }] }),
      ),
    )
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
      detail: 'lpg_gwh=beaucoup is not a decimal number',
    })
  })

  it('refuse une consommation départementale qui n’est pas un nombre', () => {
    const broken = toEstimator(
      createTemporaryCsvDataSource(
        toFixtures({ departements: [{ ...DEPARTEMENTS[0], fuel_oil_mwh: 'beaucoup' }] }),
      ),
    )
    expect(broken(request('departement', '01'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
      detail: 'fuel_oil_mwh=beaucoup is not a decimal number',
    })
  })

  it('refuse un réseau dont la livraison n’est pas un nombre', () => {
    const broken = toEstimator(
      createTemporaryCsvDataSource(toFixtures({ networks: [network('A', '01001', 'beaucoup', '0.1')] })),
    )
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
    })
  })

  describe('à l’EPCI', () => {
    it('un EPCI qui couvre tout son département évite autant que lui, avec ses réseaux de chaleur', () => {
      expect(estimate(request('epci', '200000001'))._unsafeUnwrap().reduction.toFixed()).toBe('1229.68')
    })

    it.each([
      ['un EPCI à 25 % du fioul et 50 % du GPL de son département', '200000002', '231.47'],
      ['un EPCI sur deux départements, 25 % du fioul de l’un et du GPL de l’autre', '200000003', '290.33'],
    ])('apporte %s', (_label, code, expected) => {
      expect(estimate(request('epci', code))._unsafeUnwrap().reduction.toFixed()).toBe(expected)
    })

    it('refuse un EPCI absent des consommations', () => {
      const without = toEstimator(createTemporaryCsvDataSource(toFixtures({ epcis: EPCIS.slice(1) })))
      expect(without(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'residentiel-sobriete/epcis',
        key: '200000001',
      })
    })

    it('refuse un EPCI sans surface de logements', () => {
      const without = toEstimator(
        createTemporaryCsvDataSource(toFixtures({ epciHousingRows: EPCI_HOUSING.slice(1) })),
      )
      expect(without(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'residentiel-logements/logements-epci-departement',
        key: '200000001',
      })
    })

    it('refuse un département sans surface de logements', () => {
      const without = toEstimator(
        createTemporaryCsvDataSource(toFixtures({ departementHousing: DEPARTEMENT_HOUSING.slice(1) })),
      )
      expect(without(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'residentiel-logements/logements-departement',
        key: '01',
      })
    })

    it('refuse un département sans consommation', () => {
      const without = toEstimator(
        createTemporaryCsvDataSource(toFixtures({ departements: DEPARTEMENTS.slice(1) })),
      )
      expect(without(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'residentiel-sobriete/departements',
        key: '01',
      })
    })

    it('un département sans surface au fioul n’apporte pas de fioul', () => {
      const estimateWithoutFuelSurface = toEstimator(
        createTemporaryCsvDataSource(
          toFixtures({
            epciHousingRows: [epciHousing({ epci: '200000001', departement: '75', fuelOil: '0', lpg: '0' })],
            networks: [network('Z', '75056', '1', '0')],
          }),
        ),
      )
      expect(estimateWithoutFuelSurface(request('epci', '200000001'))._unsafeUnwrap().reduction.toFixed()).toBe('170.55')
    })

    it('refuse un EPCI dont la surface dépasse celle de son département', () => {
      const broken = toEstimator(
        createTemporaryCsvDataSource(
          toFixtures({
            epciHousingRows: [epciHousing({ epci: '200000001', departement: '01', fuelOil: '401', lpg: '200' })],
          }),
        ),
      )
      expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        reason: 'control_total_mismatch',
        detail: '01: fuel_oil surface 401 exceeds the department\'s 400',
      })
    })

    it('refuse un EPCI qui a des m² dans un département qui n’en a aucun', () => {
      const broken = toEstimator(
        createTemporaryCsvDataSource(
          toFixtures({
            epciHousingRows: [epciHousing({ epci: '200000001', departement: '75', fuelOil: '10', lpg: '0' })],
          }),
        ),
      )
      expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'control_total_mismatch',
      })
    })

    it('refuse une surface de logements qui n’est pas un nombre', () => {
      const broken = toEstimator(
        createTemporaryCsvDataSource(
          toFixtures({
            departementHousing: [
              { ...DEPARTEMENT_HOUSING[0], housing_m2_house_lpg_before_1971: 'beaucoup' },
              ...DEPARTEMENT_HOUSING.slice(1),
            ],
          }),
        ),
      )
      expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
        reason: 'unreadable',
        detail: 'housing_m2_house_lpg_before_1971=beaucoup is not a decimal number',
      })
    })

    it('refuse une consommation d’EPCI qui n’est pas un nombre', () => {
      const broken = toEstimator(
        createTemporaryCsvDataSource(
          toFixtures({ epcis: [{ ...EPCIS[0], natural_gas_mwh: 'beaucoup' }, ...EPCIS.slice(1)] }),
        ),
      )
      expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        reason: 'unreadable',
        detail: 'natural_gas_mwh=beaucoup is not a decimal number',
      })
    })

    it('refuse une ligne d’EPCI sans département', () => {
      const broken = toEstimator(
        createTemporaryCsvDataSource(
          toFixtures({
            epciHousingRows: [{ ...EPCI_HOUSING[0], code_departement: '' }],
          }),
        ),
      )
      expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        reason: 'empty_key',
      })
    })
  })
})
