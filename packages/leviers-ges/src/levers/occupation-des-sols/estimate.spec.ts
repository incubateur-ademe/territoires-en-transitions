import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateOccupationDesSols } from './estimate.ts'
import {
  occupationDesSolsRequestSchema,
  type OccupationDesSolsRequest,
} from './occupation-des-sols-request.ts'

type Fixtures = Readonly<Record<string, DatasetFixture>>

const AREAS_ROW = {
  code_epci: '200000001',
  cropland_ha: '100',
  wooded_grassland_ha: '10',
  herbaceous_grassland_ha: '30',
  shrub_grassland_ha: '60',
  wetland_ha: '5',
  artificial_shrub_ha: '40',
  artificial_impervious_ha: '7',
  artificial_wooded_ha: '60',
  forest_mixed_ha: '100',
  forest_broadleaf_ha: '300',
  forest_conifer_ha: '600',
  forest_poplar_ha: '0',
}

const FACTORS_ROW = {
  code_epci: '200000001',
  wooded_grassland_to_forest_mixed: '10',
  wooded_grassland_to_forest_broadleaf: '20',
  wooded_grassland_to_forest_conifer: '30',
  wooded_grassland_to_forest_poplar: '40',
  herbaceous_grassland_to_forest_mixed: '20',
  herbaceous_grassland_to_forest_broadleaf: '30',
  herbaceous_grassland_to_forest_conifer: '40',
  herbaceous_grassland_to_forest_poplar: '50',
  shrub_grassland_to_forest_mixed: '30',
  shrub_grassland_to_forest_broadleaf: '40',
  shrub_grassland_to_forest_conifer: '50',
  shrub_grassland_to_forest_poplar: '60',
  cropland_to_wetland: '5',
  wooded_grassland_to_wetland: '15',
  herbaceous_grassland_to_wetland: '25',
  shrub_grassland_to_wetland: '10',
  impervious_to_artificial_shrub: '50',
  impervious_to_artificial_wooded: '80',
}

function toFixtures({
  areas = AREAS_ROW,
  factors = FACTORS_ROW,
}: {
  areas?: Readonly<Record<string, string>>
  factors?: Readonly<Record<string, string>>
}): Fixtures {
  return {
    'occupation-des-sols/epcis-surfaces': { keyColumn: 'code_epci', level: 'epci', rows: [areas] },
    'occupation-des-sols/epcis-facteurs': { keyColumn: 'code_epci', level: 'epci', rows: [factors] },
  }
}

type Estimator = (request: OccupationDesSolsRequest) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateOccupationDesSols(request, context)
}

function request(code: string): OccupationDesSolsRequest {
  const parsed = occupationDesSolsRequestSchema.parse({
    id: 'occupation_des_sols',
    territory: { level: 'epci', code },
    parameters: {
      afforestationHectaresPerYear: '2',
      wetlandDevelopmentHectaresPerYear: '3',
      desealingHectaresPerYear: '1',
      horizonYears: '10',
    },
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'epci' } }
}

function estimatorWith(fixtures: Parameters<typeof toFixtures>[0]): Estimator {
  return toEstimator(createTemporaryCsvDataSource(toFixtures(fixtures)))
}

const estimate = estimatorWith({})

describe('estimate, occupation_des_sols', () => {
  it('stocke pour l’EPCI 200000001 : 800 + 300 + 68 = 1 168 tCO2e', () => {
    expect(estimate(request('200000001'))._unsafeUnwrap().reduction.toFixed()).toBe('1168')
  })

  it('renvoie les deux interprétations appliquées et leurs limites', () => {
    const { appliedAssumptions } = estimate(request('200000001'))._unsafeUnwrap()
    expect(Object.keys(appliedAssumptions)).toEqual([
      'grasslandTypes',
      'zeroReferenceArea',
      'desealingWithoutHorizon',
    ])
    expect(appliedAssumptions['desealingWithoutHorizon']?.value).toBe(
      'le terme de désimperméabilisation n’est pas multiplié par l’horizon de temps',
    )
  })

  it('refuse un EPCI absent des surfaces', () => {
    expect(estimate(request('999999999'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'occupation-des-sols/epcis-surfaces',
      key: '999999999',
    })
  })

  it('refuse un EPCI absent des facteurs', () => {
    const withoutFactors = estimatorWith({ factors: { ...FACTORS_ROW, code_epci: '200000002' } })
    expect(withoutFactors(request('200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'occupation-des-sols/epcis-facteurs',
      key: '200000001',
    })
  })

  it('refuse une surface qui n’est pas un nombre', () => {
    const broken = estimatorWith({ areas: { ...AREAS_ROW, forest_mixed_ha: 'beaucoup' } })
    expect(broken(request('200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'occupation-des-sols/epcis-surfaces',
      reason: 'unreadable',
      detail: 'forest_mixed_ha=beaucoup is not a decimal number',
    })
  })

  it('refuse un facteur qui n’est pas un nombre', () => {
    const broken = estimatorWith({ factors: { ...FACTORS_ROW, cropland_to_wetland: 'beaucoup' } })
    expect(broken(request('200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'occupation-des-sols/epcis-facteurs',
      reason: 'unreadable',
      detail: 'cropland_to_wetland=beaucoup is not a decimal number',
    })
  })

  it('refuse un jeu de facteurs sans colonne de conversion', () => {
    const incomplete = Object.fromEntries(
      Object.entries(FACTORS_ROW).filter(([column]) => column !== 'wooded_grassland_to_forest_mixed'),
    )
    expect(estimatorWith({ factors: incomplete })(request('200000001'))._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_dataset',
      dataset: 'occupation-des-sols/epcis-facteurs',
      reason: 'columns_mismatch',
      detail: 'wooded_grassland_to_forest_mixed',
    })
  })
})
