import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateTransportMarchandisesEfficacite } from './estimate.ts'
import {
  transportMarchandisesEfficaciteRequestSchema,
  type TransportMarchandisesEfficaciteRequest,
} from './transport-marchandises-efficacite-request.ts'

const FIXTURES: Readonly<Record<string, DatasetFixture>> = {
  'transport-marchandises/regions': {
    keyColumn: 'code_region',
    level: 'region',
    rows: [
      {
        code_region: '84',
        billion_tonne_kilometres: '0.001',
        heavy_vehicle_fleet: '1000',
        zero_emission_heavy_vehicle_fleet: '0',
        diesel_emission_factor_g_per_vehicle_km: '648',
        diesel_unclassified_share: '0',
      },
    ],
  },
}

type Estimator = (
  request: TransportMarchandisesEfficaciteRequest,
) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportMarchandisesEfficacite(request, context)
}

function request(code: string): TransportMarchandisesEfficaciteRequest {
  const parsed = transportMarchandisesEfficaciteRequestSchema.parse({
    id: 'transport_marchandises_efficacite',
    territory: { level: 'region', code },
    parameters: { ecodrivingApplicationFraction: '0.5', loadFactorIncrease: '0.2' },
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'region' } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, transport_marchandises_efficacite', () => {
  it('évite 16,67 tCO2e pour 1 000 000 t.km à 0,08 kgCO2e/t.km, 50 % d’écoconduite et 20 % de chargement en plus', () => {
    expect(estimate(request('84'))._unsafeUnwrap().reduction.toFixed()).toBe('16.67')
  })

  it('renvoie le potentiel d’écoconduite et les hypothèses de données', () => {
    const { appliedAssumptions } = estimate(request('84'))._unsafeUnwrap()
    expect({
      ecodriving: appliedAssumptions['ecodrivingPotential']?.value,
      keys: Object.keys(appliedAssumptions),
    }).toEqual({
      ecodriving: '0.1',
      keys: [
        'includeInternationalFlows',
        'heavyVehicleTripType',
        'heavyVehicleThermalEmissionFactor',
        'heavyVehicleLoadFactor',
        'dieselUnclassifiedShare',
        'electricHeavyVehicleEmissionFactor',
        'ecodrivingPotential',
      ],
    })
  })

  it('refuse une région absente du jeu', () => {
    expect(estimate(request('99'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'transport-marchandises/regions',
      key: '99',
    })
  })
})
