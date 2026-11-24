import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataRow, DataSource, DataSourceError } from '../../domain/data-source.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateTransportMarchandisesElectrification } from './estimate.ts'
import {
  transportMarchandisesElectrificationRequestSchema,
  type TransportMarchandisesElectrificationRequest,
} from './transport-marchandises-electrification-request.ts'

const REGION_ROW: DataRow = {
  billion_tonne_kilometres: '0.001',
  heavy_vehicle_fleet: '1000',
  zero_emission_heavy_vehicle_fleet: '0',
  diesel_emission_factor_g_per_vehicle_km: '648',
  diesel_unclassified_share: '0',
}

const FIXTURES: Readonly<Record<string, DatasetFixture>> = {
  'transport-marchandises/regions': {
    keyColumn: 'code_region',
    level: 'region',
    rows: [
      { code_region: '84', ...REGION_ROW },
      { code_region: '11', ...REGION_ROW, zero_emission_heavy_vehicle_fleet: '900' },
      { code_region: '94', ...REGION_ROW, zero_emission_heavy_vehicle_fleet: '1000' },
    ],
  },
}

type Estimator = (
  request: TransportMarchandisesElectrificationRequest,
) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportMarchandisesElectrification(request, context)
}

function request(code: string, additionalElectrifiedFleetFraction = '0.2'): TransportMarchandisesElectrificationRequest {
  const parsed = transportMarchandisesElectrificationRequestSchema.parse({
    id: 'transport_marchandises_electrification',
    territory: { level: 'region', code },
    parameters: { additionalElectrifiedFleetFraction },
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'region' } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, transport_marchandises_electrification', () => {
  it('évite 6,66 tCO2e : 20 % de 1 000 000 t.km, du thermique à 0,08 à l’électrique à 0,0467', () => {
    expect(estimate(request('84'))._unsafeUnwrap().reduction.toFixed()).toBe('6.66')
  })

  it('plafonne la part demandée à la part thermique : 90 % de zéro émission laissent 10 %, soit 3,33 tCO2e en région 11', () => {
    const result = estimate(request('11'))._unsafeUnwrap()
    expect({
      reduction: result.reduction.toFixed(),
      share: result.appliedAssumptions['additionalElectrifiedFleetFraction']?.value,
      limit: result.appliedAssumptions['additionalElectrifiedFleetFraction']?.limit,
    }).toEqual({
      reduction: '3.33',
      share: '0.1',
      limit: expect.stringContaining('plafonnée') as string,
    })
  })

  it('ne laisse rien à électrifier dans un parc tout zéro émission, et le dit', () => {
    const result = estimate(request('94'))._unsafeUnwrap()
    expect({
      reduction: result.reduction.toFixed(),
      limit: result.appliedAssumptions['additionalElectrifiedFleetFraction']?.limit,
    }).toEqual({ reduction: '0', limit: expect.stringContaining('rien ne peut être électrifié') as string })
  })

  it('ne renvoie pas de plafond quand la part demandée tient dans le parc thermique', () => {
    expect(
      estimate(request('84'))._unsafeUnwrap().appliedAssumptions['additionalElectrifiedFleetFraction'],
    ).toBeUndefined()
  })

  it('renvoie les hypothèses de données', () => {
    expect(Object.keys(estimate(request('84'))._unsafeUnwrap().appliedAssumptions)).toEqual([
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
