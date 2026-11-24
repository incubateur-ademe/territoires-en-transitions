import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { UnknownTerritory } from '../../domain/territory-index.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateFertilisationAzotee } from './estimate.ts'
import {
  fertilisationAzoteeRequestSchema,
  type FertilisationAzoteeRequest,
} from './fertilisation-azotee-request.ts'

const FIXTURES: Readonly<Record<string, DatasetFixture>> = {
  'fertilisation-azotee/regions': {
    keyColumn: 'code_region',
    level: 'region',
    rows: [
      {
        code_region: '84',
        nitrogen_delivered_tonnes_2022_2023: '1000',
        nitrogen_delivered_tonnes_2023_2024: '3000',
      },
    ],
  },
  'fertilisation-azotee/departements': {
    keyColumn: 'code_departement',
    level: 'departement',
    rows: [{ code_departement: '01', nitrogen_delivered_tonnes_2022_2023: '400', nitrogen_delivered_tonnes_2023_2024: '600' }],
  },
}

type Estimator = (
  request: FertilisationAzoteeRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateFertilisationAzotee(request, context)
}

function request(
  level: ComputedLevels<'fertilisation_azotee'>,
  code: string,
  nitrogenReductionFraction = '0.1',
): FertilisationAzoteeRequest {
  const parsed = fertilisationAzoteeRequestSchema.parse({
    id: 'fertilisation_azotee',
    territory: { level, code },
    parameters: { nitrogenReductionFraction },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, fertilisation_azotee', () => {
  it('évite pour la région 84 : 10 % de la moyenne de 1 000 et 3 000 t, soit 2 000 t, évitent 1 146,6 tCO2e', () => {
    expect(estimate(request('region', '84'))._unsafeUnwrap().reduction.toFixed()).toBe('1146.6')
  })

  it('évite pour le département 01 : 10 % de 500 t évitent 286,65 tCO2e', () => {
    expect(estimate(request('departement', '01'))._unsafeUnwrap().reduction.toFixed()).toBe('286.65')
  })

  it('renvoie la moyenne de deux campagnes pour une région comme pour un département', () => {
    const campaigns = (level: ComputedLevels<'fertilisation_azotee'>, code: string) =>
      estimate(request(level, code))._unsafeUnwrap().appliedAssumptions['nitrogenCampaigns']?.value
    expect({
      region: campaigns('region', '84'),
      departement: campaigns('departement', '01'),
    }).toEqual({
      region: 'moyenne des campagnes 2022-2023 (révisée) et 2023-2024',
      departement: 'moyenne des campagnes 2022-2023 (révisée) et 2023-2024',
    })
  })

  it('renvoie le facteur d’émission et sa limite', () => {
    const factor = estimate(request('region', '84'))._unsafeUnwrap().appliedAssumptions[
      'nitrogenSpreadingEmissionFactor'
    ]
    expect(factor).toMatchObject({ value: '5.733', limit: expect.stringContaining('400 %') as string })
  })

  it.each([
    ['une région absente du jeu', request('region', '99'), 'fertilisation-azotee/regions'],
    ['un département absent du jeu', request('departement', '2A'), 'fertilisation-azotee/departements'],
  ])('refuse %s', (_label, input, dataset) => {
    expect(estimate(input)._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset,
      key: input.territory.code,
    })
  })

  it.each([
    ['region', 'code_region', 'fertilisation-azotee/regions', '84'],
    ['departement', 'code_departement', 'fertilisation-azotee/departements', '01'],
  ] as const)('refuse des tonnes qui ne sont pas un nombre pour un niveau %s', (level, key, dataset, code) => {
    const broken = toEstimator(
      createTemporaryCsvDataSource({
        ...FIXTURES,
        [dataset]: {
          keyColumn: key,
          level,
          rows: [
            {
              [key]: code,
              nitrogen_delivered_tonnes_2022_2023: 'beaucoup',
              nitrogen_delivered_tonnes_2023_2024: '1',
            },
          ],
        },
      }),
    )
    expect(broken(request(level, code))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
    })
  })

  describe('à l’EPCI', () => {
    const NITROGEN_DEPARTEMENTS = [
      { code_departement: '01', nitrogen_delivered_tonnes_2022_2023: '500', nitrogen_delivered_tonnes_2023_2024: '700' },
      { code_departement: '69', nitrogen_delivered_tonnes_2022_2023: '900', nitrogen_delivered_tonnes_2023_2024: '1100' },
      { code_departement: '75', nitrogen_delivered_tonnes_2022_2023: '17315', nitrogen_delivered_tonnes_2023_2024: '17515' },
      { code_departement: '80', nitrogen_delivered_tonnes_2022_2023: '150', nitrogen_delivered_tonnes_2023_2024: '250' },
    ]
    const COMMUNES = ([
      ['01001', '200000001', '01'],
      ['01002', '200000001', '01'],
      ['01003', '200000002', '01'],
      ['69001', '200000002', '69'],
      ['69002', '200000005', '69'],
      ['75056', '200000003', '75'],
      ['01004', '200000004', '01'],
      ['01005', '200000007', '01'],
      ['80001', '200000006', '80'],
      ['2A001', '200000009', '2A'],
    ] as const).map(([code_commune, code_epci, code_departement]) => ({
      code_commune,
      code_epci,
      code_departement,
      code_region: '84',
    }))
    const AGRICULTURAL_AREAS = ([
      ['01001', '100'],
      ['01002', '50'],
      ['01003', '150'],
      ['69001', '200'],
      ['69002', '200'],
      ['75056', '1'],
      ['01004', '10'],
      ['80001', '100'],
      ['2A001', '10'],
      ['99999', '1000'],
    ] as const).map(([code_commune, agricultural_area_ha]) => ({ code_commune, agricultural_area_ha }))
    const ORGANIC_EPCIS = ([
      ['200000001', '01', '30'],
      ['200000002', '01', '15'],
      ['200000002', '69', '40'],
      ['200000003', '75', '190'],
      ['200000006', '80', '10'],
      ['200000009', '2A', '1'],
    ] as const).map(([code_epci, code_departement, organic_hectares]) => ({
      epci_departement: `${code_epci}-${code_departement}`,
      code_epci,
      code_departement,
      organic_hectares,
    }))
    const ORGANIC_DEPARTEMENTS = [
      { code_departement: '01', organic_hectares: '60' },
      { code_departement: '69', organic_hectares: '80' },
      { code_departement: '75', organic_hectares: '190' },
      { code_departement: '80', organic_hectares: '50' },
    ]

    function epciFixtures(
      overrides: Readonly<Record<string, DatasetFixture>> = {},
    ): Readonly<Record<string, DatasetFixture>> {
      return {
        ...FIXTURES,
        'fertilisation-azotee/departements': {
          keyColumn: 'code_departement',
          level: 'departement',
          rows: NITROGEN_DEPARTEMENTS,
        },
        'territoires/communes': { keyColumn: 'code_commune', rows: COMMUNES },
        'surface-agricole-utile/communes': { keyColumn: 'code_commune', rows: AGRICULTURAL_AREAS },
        'fertilisation-azotee/organic-epci-departements': {
          keyColumn: 'epci_departement',
          rows: ORGANIC_EPCIS,
        },
        'fertilisation-azotee/organic-departements': {
          keyColumn: 'code_departement',
          level: 'departement',
          rows: ORGANIC_DEPARTEMENTS,
        },
        ...overrides,
      }
    }

    const estimateEpci = toEstimator(createTemporaryCsvDataSource(epciFixtures()))

    it.each([
      ['200000001, 48 % de la SAU hors bio du département 01 : 288 t', '200000001', '165.11'],
      ['200000002, à cheval sur 01 et 69 : 324 + 500 t', '200000002', '472.4'],
      ['200000003, Paris : bio supérieure à la SAU, aucune part', '200000003', '0'],
      ['200000006, plafonné à tout le département 80 : 200 t', '200000006', '114.66'],
      ['200000007, sans aucune SAU : rien à ventiler', '200000007', '0'],
    ])('évite pour l’EPCI %s tCO2e à 10 %%', (_label, code, expected) => {
      expect(estimateEpci(request('epci', code))._unsafeUnwrap().reduction.toFixed()).toBe(expected)
    })

    it('renvoie la moyenne de deux campagnes à l’EPCI', () => {
      expect(
        estimateEpci(request('epci', '200000001'))._unsafeUnwrap().appliedAssumptions[
          'nitrogenCampaigns'
        ]?.value,
      ).toBe('moyenne des campagnes 2022-2023 (révisée) et 2023-2024')
    })

    it('ignore une commune de SAU absente du référentiel : résultat inchangé à 165,11 tCO2e', () => {
      const withUnknownCommune = estimateEpci(request('epci', '200000001'))._unsafeUnwrap()
      expect(withUnknownCommune.reduction.toFixed()).toBe('165.11')
    })

    it.each([
      ['un EPCI sans surface bio (secret statistique)', '200000004', 'fertilisation-azotee/organic-epci-departements', '200000004-01'],
      ['un département sans livraison d’azote', '200000009', 'fertilisation-azotee/departements', '2A'],
    ])('refuse %s', (_label, code, dataset, key) => {
      expect(estimateEpci(request('epci', code))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset,
        key,
      })
    })

    it('refuse un département sans surface bio', () => {
      const withoutDepartementOrganic = toEstimator(
        createTemporaryCsvDataSource(
          epciFixtures({
            'fertilisation-azotee/organic-departements': {
              keyColumn: 'code_departement',
              level: 'departement',
              rows: [{ code_departement: '69', organic_hectares: '80' }],
            },
          }),
        ),
      )
      expect(withoutDepartementOrganic(request('epci', '200000001'))._unsafeUnwrapErr()).toEqual({
        kind: 'missing_data',
        dataset: 'fertilisation-azotee/organic-departements',
        key: '01',
      })
    })

    it('refuse un EPCI inconnu', () => {
      expect(estimateEpci(request('epci', '999999999'))._unsafeUnwrapErr()).toEqual({
        kind: 'unknown_territory',
        level: 'epci',
        code: '999999999',
      })
    })

    it.each([
      ['de SAU', 'surface-agricole-utile/communes', 'code_commune', [{ code_commune: '01001', agricultural_area_ha: 'beaucoup' }]],
      ['de surface bio', 'fertilisation-azotee/organic-epci-departements', 'epci_departement', [{ epci_departement: '200000001-01', code_epci: '200000001', code_departement: '01', organic_hectares: 'beaucoup' }]],
    ])('refuse une valeur %s qui n’est pas un nombre', (_label, dataset, keyColumn, rows) => {
      const broken = toEstimator(
        createTemporaryCsvDataSource(epciFixtures({ [dataset]: { keyColumn, rows } })),
      )
      expect(broken(request('epci', '200000001'))._unsafeUnwrapErr()).toMatchObject({
        kind: 'invalid_dataset',
        dataset,
        reason: 'unreadable',
      })
    })
  })
})
