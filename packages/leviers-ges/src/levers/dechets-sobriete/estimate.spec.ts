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
import { estimate as estimateDechetsSobriete } from './estimate.ts'
import {
  dechetsSobrieteRequestSchema,
  type DechetsSobrieteRequest,
} from './dechets-sobriete-request.ts'

type ReductionParameters = {
  readonly storageReductionFraction: string
  readonly incinerationReductionFraction: string
}

const COMMUNES: readonly DataRow[] = [
  { code_commune: '01001', code_epci: '200000001', code_departement: '01', code_region: '84' },
  { code_commune: '01002', code_epci: '200000002', code_departement: '01', code_region: '84' },
  { code_commune: '75056', code_epci: '200000003', code_departement: '75', code_region: '11' },
]

function flow({
  commune,
  wasteCode,
  mode,
  tonnes,
}: {
  commune: string
  wasteCode: string
  mode: string
  tonnes: string
}): DataRow {
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
      flow({ commune: '01001', wasteCode: '20 03 01', mode: 'storage', tonnes: '100' }),
      flow({ commune: '01001', wasteCode: '20 03 01', mode: 'incineration', tonnes: '200' }),
      flow({ commune: '01002', wasteCode: '20 03 01', mode: 'storage', tonnes: '50' }),
      flow({ commune: '01002', wasteCode: '20 02 02', mode: 'storage', tonnes: '1000' }),
      flow({ commune: '75056', wasteCode: '20 03 01', mode: 'incineration', tonnes: '400' }),
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
  request: DechetsSobrieteRequest,
) => Result<EstimateResult, DataSourceError | UnknownTerritory>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateDechetsSobriete(request, context)
}

const REDUCTIONS: ReductionParameters = {
  storageReductionFraction: '0.5',
  incinerationReductionFraction: '0.1',
}

function request(
  level: ComputedLevels<'dechets_sobriete'>,
  code: string,
  parameters: ReductionParameters = REDUCTIONS,
): DechetsSobrieteRequest {
  const parsed = dechetsSobrieteRequestSchema.parse({
    id: 'dechets_sobriete',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, dechets_sobriete', () => {
  it.each([
    ['l’EPCI 200000001 : 100 t stockées et 200 t incinérées', request('epci', '200000001'), '22'],
    ['la région 84, deux EPCI : 150 t stockées, 200 t incinérées', request('region', '84'), '32'],
    ['le département 01', request('departement', '01'), '32'],
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
          rows: [flow({ commune: '75056', wasteCode: '20 03 01', mode: 'incineration', tonnes: '400' })],
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
          rows: [flow({ commune: '01001', wasteCode: '20 03 01', mode: 'storage', tonnes: 'beaucoup' })],
        },
      }),
    )
    expect(broken(request('region', '84'))._unsafeUnwrapErr()).toMatchObject({
      kind: 'invalid_dataset',
      reason: 'unreadable',
    })
  })
})
