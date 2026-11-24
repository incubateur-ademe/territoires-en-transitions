import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataRow, DataSource, DataSourceError } from '../../domain/data-source.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateElevageDurable } from './estimate.ts'
import {
  elevageDurableRequestSchema,
  type ElevageDurableRequest,
} from './elevage-durable-request.ts'

const HEADCOUNTS: DataRow = {
  dairy_cows: '1000',
  other_cattle: '0',
  sows: '500',
  other_pigs: '0',
  goats: '0',
  sheep: '2000',
  horses: '0',
  mules_and_donkeys: '0',
  laying_hens: '0',
  broilers: '0',
  other_poultry: '0',
}

const FIXTURES: Readonly<Record<string, DatasetFixture>> = {
  'elevage-durable/regions': {
    keyColumn: 'code_region',
    level: 'region',
    rows: [{ code_region: '84', ...HEADCOUNTS }],
  },
  'elevage-durable/departements': {
    keyColumn: 'code_departement',
    level: 'departement',
    rows: [{ code_departement: '01', ...HEADCOUNTS, dairy_cows: '500' }],
  },
}

const SAME_SHARES = { liquid: '0.41', solid: '0.2', pasture: '0.39', anaerobicDigestion: '0' }

const SHEEP = {
  headcountReductionFraction: '0.1',
  entericEmissionReductionFraction: '0.1',
  targetManureShares: { liquid: '0', solid: '0.5', pasture: '0.5', anaerobicDigestion: '0' },
}

const DAIRY_COWS_REMOVED = {
  headcountReductionFraction: '1',
  targetManureShares: SAME_SHARES,
}

type Estimator = (request: ElevageDurableRequest) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateElevageDurable(request, context)
}

function request(
  level: ComputedLevels<'elevage_durable'>,
  code: string,
  animals: unknown,
): ElevageDurableRequest {
  const parsed = elevageDurableRequestSchema.parse({
    id: 'elevage_durable',
    territory: { level, code },
    parameters: { animals },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

function assumptionsOf(input: ElevageDurableRequest) {
  return estimate(input)._unsafeUnwrap().appliedAssumptions
}

describe('estimate, elevage_durable', () => {
  it.each([
    ['la région 84, 1 000 vaches laitières supprimées', request('region', '84', { dairyCows: DAIRY_COWS_REMOVED }), '5008.45'],
    ['le département 01, 500 vaches laitières supprimées', request('departement', '01', { dairyCows: DAIRY_COWS_REMOVED }), '2504.22'],
    ['la région 84, 2 000 ovins', request('region', '84', { sheep: SHEEP }), '127.81'],
    [
      'la région 84, vaches laitières et ovins',
      request('region', '84', { dairyCows: DAIRY_COWS_REMOVED, sheep: SHEEP }),
      '5136.26',
    ],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('renvoie les animaux laissés tels quels', () => {
    const unchanged = assumptionsOf(request('region', '84', { sheep: SHEEP }))['unchangedAnimals']
    expect(unchanged?.value).toBe(
      'dairyCows, otherCattle, sows, otherPigs, goats, horses, mulesAndDonkeys, layingHens, broilers, otherPoultry',
    )
  })

  it('ne renvoie pas d’animaux laissés tels quels quand tous sont changés', () => {
    const everyAnimal = Object.fromEntries(
      [
        'dairyCows',
        'otherCattle',
        'sows',
        'otherPigs',
        'goats',
        'sheep',
        'horses',
        'mulesAndDonkeys',
        'layingHens',
        'broilers',
        'otherPoultry',
      ].map((animal) => [animal, SHEEP]),
    )
    expect(assumptionsOf(request('region', '84', everyAnimal))['unchangedAnimals']).toBeUndefined()
  })

  it('renvoie la baisse entérique par défaut avec les animaux concernés, et pas celle de la requête', () => {
    const defaulted = assumptionsOf(request('region', '84', { sheep: SHEEP, dairyCows: DAIRY_COWS_REMOVED }))[
      'entericEmissionReductionFraction'
    ]
    expect({ value: defaulted?.value, limit: defaulted?.limit }).toEqual({
      value: '0',
      limit: expect.stringContaining('Appliquée à : dairyCows.') as string,
    })
    expect(
      assumptionsOf(request('region', '84', { sheep: SHEEP }))['entericEmissionReductionFraction'],
    ).toBeUndefined()
  })

  it('renvoie les facteurs de méthanisation quand une part de méthanisation est demandée', () => {
    const digestion = {
      headcountReductionFraction: '0',
      targetManureShares: { liquid: '0', solid: '0', pasture: '0', anaerobicDigestion: '1' },
    }
    expect(
      assumptionsOf(request('region', '84', { dairyCows: digestion }))['methanisationFactors'],
    ).toMatchObject({ source: 'OMINEA 2026 du CITEPA, bovins et porcins' })
    expect(assumptionsOf(request('region', '84', { sheep: SHEEP }))['methanisationFactors']).toBeUndefined()
  })

  it('renvoie les hypothèses de données, toujours', () => {
    expect(Object.keys(assumptionsOf(request('region', '84', { sheep: SHEEP })))).toEqual(
      expect.arrayContaining(['currentManureShares', 'animalParameters', 'livestockHeadcounts']),
    )
  })

  it.each([
    ['une région absente du jeu', request('region', '99', { sheep: SHEEP }), 'elevage-durable/regions'],
    ['un département absent du jeu', request('departement', '75', { sheep: SHEEP }), 'elevage-durable/departements'],
  ])('refuse %s', (_label, input, dataset) => {
    expect(estimate(input)._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset,
      key: input.territory.code,
    })
  })

  it.each([
    ['region', 'code_region', 'elevage-durable/regions', '84'],
    ['departement', 'code_departement', 'elevage-durable/departements', '01'],
  ] as const)('refuse des effectifs qui ne sont pas un nombre pour un niveau %s', (level, key, dataset, code) => {
    const broken = toEstimator(
      createTemporaryCsvDataSource({
        ...FIXTURES,
        [dataset]: { keyColumn: key, level, rows: [{ [key]: code, ...HEADCOUNTS, sheep: 'beaucoup' }] },
      }),
    )
    expect(broken(request(level, code, { sheep: SHEEP }))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
    })
  })
})
