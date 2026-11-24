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
import { estimate as estimateDechetsModeDeTraitement } from './estimate.ts'
import {
  dechetsModeDeTraitementRequestSchema,
  type DechetsModeDeTraitementRequest,
} from './dechets-mode-de-traitement-request.ts'

type Parameters = {
  readonly storageToIncinerationFraction: string
  readonly storageToMaterialRecoveryFraction: string
  readonly incinerationToMaterialRecoveryFraction: string
}

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000002', code_departement: '01', code_region: '84' },
  { code_commune: '75056', code_epci: '200000003', code_departement: '75', code_region: '11' },
]

function flow(commune: string, wasteCode: string, mode: string, tonnes: string): DataRow {
  return {
    flow_id: `${commune}:${wasteCode}:${mode}`,
    commune_code: commune,
    waste_code: wasteCode,
    treatment_mode: mode,
    tonnes_per_year: tonnes,
  }
}

const FIXTURES: Readonly<Record<string, DatasetFixture>> = {
  'territoires/communes': { keyColumn: 'code_commune', rows: COMMUNES },
  'dechets/treatment-flows': {
    keyColumn: 'flow_id',
    rows: [
      flow('01001', '20 03 01', 'storage', '100'),
      flow('01001', '20 03 01', 'incineration', '200'),
      flow('01002', '20 03 01', 'storage', '50'),
      flow('01002', '20 02 02', 'storage', '1000'),
      flow('75056', '20 03 01', 'incineration', '400'),
    ],
  },
  'dechets/emission-factors': {
    keyColumn: 'waste_code',
    rows: [
      {
        waste_code: '20 03 01',
        storage_emission_factor_kg_per_tonne: '400',
        incineration_emission_factor_kg_per_tonne: '100',
      },
      {
        waste_code: '20 02 02',
        storage_emission_factor_kg_per_tonne: '',
        incineration_emission_factor_kg_per_tonne: '',
      },
    ],
  },
}

type Estimator = (
  request: DechetsModeDeTraitementRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateDechetsModeDeTraitement(request, context)
}

const SHIFTS: Parameters = {
  storageToIncinerationFraction: '0.5',
  storageToMaterialRecoveryFraction: '0.25',
  incinerationToMaterialRecoveryFraction: '0.1',
}

function request(
  level: ComputedLevels<'dechets_mode_de_traitement'>,
  code: string,
  parameters: Parameters = SHIFTS,
): DechetsModeDeTraitementRequest {
  const parsed = dechetsModeDeTraitementRequestSchema.parse({
    id: 'dechets_mode_de_traitement',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, dechets_mode_de_traitement', () => {
  it.each([
    ['l’EPCI 200000001 : 100 t stockées et 200 t incinérées', request('epci', '200000001'), '27'],
    ['la région 84, deux EPCI : 150 t stockées, 200 t incinérées', request('region', '84'), '39.5'],
    ['le département 01', request('departement', '01'), '39.5'],
    ['la région 11 : 400 t incinérées', request('region', '11'), '4'],
  ])('évite pour %s : %s tCO2e par an', (_label, input, expected) => {
    expect(estimate(input)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('renvoie zéro pour un EPCI sans site de traitement', () => {
    const withoutSite = toEstimator(
      createTemporaryCsvDataSource({
        ...FIXTURES,
        'dechets/treatment-flows': {
          keyColumn: 'flow_id',
          rows: [flow('75056', '20 03 01', 'incineration', '400')],
        },
      }),
    )
    expect(withoutSite(request('epci', '200000001'))._unsafeUnwrap().reduction.toFixed()).toBe('0')
  })

  it('renvoie le périmètre des sites et les 1 000 t de la région 84 sans facteur', () => {
    const { appliedAssumptions } = estimate(request('region', '84'))._unsafeUnwrap()
    expect({
      scope: appliedAssumptions['wasteScope']?.value,
      uncovered: appliedAssumptions['wasteTonnesWithoutEmissionFactor']?.value,
    }).toEqual({ scope: 'sites de traitement situés dans le territoire', uncovered: '1000' })
  })

  it('ne renvoie pas de tonnes sans facteur quand tous les déchets en ont', () => {
    const { appliedAssumptions } = estimate(request('region', '11'))._unsafeUnwrap()
    expect(Object.keys(appliedAssumptions)).toEqual(['wasteScope'])
  })

  it.each([
    ['une région absente de la géographie', request('region', '99')],
    ['un département absent de la géographie', request('departement', '99')],
    ['un EPCI absent de la géographie', request('epci', '999999999')],
  ])('refuse %s', (_label, input) => {
    expect(estimate(input)._unsafeUnwrapErr()).toMatchObject({ kind: 'unknown_territory' })
  })

  it('refuse un jeu de flux illisible', () => {
    const broken = toEstimator(
      createTemporaryCsvDataSource({
        ...FIXTURES,
        'dechets/treatment-flows': {
          keyColumn: 'flow_id',
          rows: [flow('01001', '20 03 01', 'storage', 'beaucoup')],
        },
      }),
    )
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
    })
  })
})
