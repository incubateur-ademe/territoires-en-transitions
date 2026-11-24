import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateTransportMarchandisesSobrieteLogistique } from './estimate.ts'
import {
  transportMarchandisesSobrieteLogistiqueRequestSchema,
  type TransportMarchandisesSobrieteLogistiqueRequest,
} from './transport-marchandises-sobriete-logistique-request.ts'

const FIXTURES: Readonly<Record<string, DatasetFixture>> = {
  'transport-marchandises/regions': {
    keyColumn: 'code_region',
    level: 'region',
    rows: [
      {
        code_region: '84',
        billion_tonne_kilometres: '30',
        heavy_vehicle_fleet: '1000',
        zero_emission_heavy_vehicle_fleet: '0',
        diesel_emission_factor_g_per_vehicle_km: '810',
        diesel_unclassified_share: '0.09',
      },
      {
        code_region: '11',
        billion_tonne_kilometres: '20',
        heavy_vehicle_fleet: '1000',
        zero_emission_heavy_vehicle_fleet: '250',
        diesel_emission_factor_g_per_vehicle_km: '810',
        diesel_unclassified_share: '0',
      },
    ],
  },
}

type Estimator = (
  request: TransportMarchandisesSobrieteLogistiqueRequest,
) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportMarchandisesSobrieteLogistique(request, context)
}

function request(
  code: string,
  roadFreightReductionFraction = '0.1',
): TransportMarchandisesSobrieteLogistiqueRequest {
  const parsed = transportMarchandisesSobrieteLogistiqueRequestSchema.parse({
    id: 'transport_marchandises_sobriete_logistique',
    territory: { level: 'region', code },
    parameters: { roadFreightReductionFraction },
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'region' } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, transport_marchandises_sobriete_logistique', () => {
  it.each([
    ['la région 84, sans poids lourd électrique : 10 % de 30 milliards de t.km à 0,1 kgCO2e/t.km', '84', '300000'],
    ['la région 11, un quart électrique : 10 % de 20 milliards de t.km à 0,086675', '11', '173350'],
  ])('évite pour %s : %s tCO2e par an', (_label, code, expected) => {
    expect(estimate(request(code))._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('renvoie les hypothèses de données', () => {
    const { appliedAssumptions } = estimate(request('84'))._unsafeUnwrap()
    expect(Object.keys(appliedAssumptions)).toEqual([
      'includeInternationalFlows',
      'heavyVehicleTripType',
      'heavyVehicleThermalEmissionFactor',
      'heavyVehicleLoadFactor',
      'dieselUnclassifiedShare',
      'electricHeavyVehicleEmissionFactor',
    ])
  })

  it('refuse une région absente du jeu', () => {
    expect(estimate(request('99'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'transport-marchandises/regions',
      key: '99',
    })
  })
})
