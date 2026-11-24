import type { Result } from 'neverthrow'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { EstimateResult } from '../../application/estimate/estimate-result.ts'
import type { DataSource, DataSourceError } from '../../domain/data-source.ts'
import {
  createTemporaryCsvDataSource,
  type DatasetFixture,
} from '../../testing/temporary-csv-data-source.ts'
import { estimate as estimateTransportMarchandisesReportModal } from './estimate.ts'
import {
  transportMarchandisesReportModalRequestSchema,
  type TransportMarchandisesReportModalRequest,
} from './transport-marchandises-report-modal-request.ts'

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
  request: TransportMarchandisesReportModalRequest,
) => Result<EstimateResult, DataSourceError>

function toEstimator(dataSource: DataSource): Estimator {
  const context = createEstimationContext(dataSource)
  return (request) => estimateTransportMarchandisesReportModal(request, context)
}

function request(
  code: string,
  parameters: Readonly<Record<string, string>> = {
    roadToRailFraction: '0.1',
    roadToWaterwayFraction: '0.05',
  },
): TransportMarchandisesReportModalRequest {
  const parsed = transportMarchandisesReportModalRequestSchema.parse({
    id: 'transport_marchandises_report_modal',
    territory: { level: 'region', code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'region' } }
}

const estimate = toEstimator(createTemporaryCsvDataSource(FIXTURES))

describe('estimate, transport_marchandises_report_modal', () => {
  it('évite 7,99 tCO2e (7,994181076 avant arrondi) pour 1 000 000 t.km à 0,08 kgCO2e/t.km, 10 % de ferroviaire et 5 % de fluvial', () => {
    expect(estimate(request('84'))._unsafeUnwrap().reduction.toFixed()).toBe('7.99')
  })

  it('retire la cyclologistique de la base : 400 000 t.km en moins donnent 4,80 tCO2e', () => {
    const withCyclologistics = request('84', {
      roadToRailFraction: '0.1',
      roadToWaterwayFraction: '0.05',
      cyclologisticTonneKilometres: '400000',
    })
    expect(estimate(withCyclologistics)._unsafeUnwrap().reduction.toFixed()).toBe('4.8')
  })

  it('renvoie les facteurs ferroviaire et fluvial, les coefficients et la cyclologistique par défaut', () => {
    const { appliedAssumptions } = estimate(request('84'))._unsafeUnwrap()
    expect({
      rail: appliedAssumptions['railFreightEmissionFactor']?.value,
      waterway: appliedAssumptions['waterwayFreightEmissionFactor']?.value,
      coefficients: appliedAssumptions['modalShiftCoefficients']?.value,
      cyclologistic: appliedAssumptions['cyclologisticTonneKilometres']?.value,
    }).toEqual({
      rail: '0.007278',
      waterway: '0.0206283',
      coefficients: 'fer 0,8064 route et 1,0164 fer, voie d’eau 0,8176 route et 0,9576 voie d’eau',
      cyclologistic: '0',
    })
  })

  it('ne renvoie pas la cyclologistique saisie', () => {
    const withCyclologistics = request('84', {
      roadToRailFraction: '0.1',
      roadToWaterwayFraction: '0.05',
      cyclologisticTonneKilometres: '1',
    })
    expect(
      estimate(withCyclologistics)._unsafeUnwrap().appliedAssumptions['cyclologisticTonneKilometres'],
    ).toBeUndefined()
  })

  it('refuse une région absente du jeu', () => {
    expect(estimate(request('99'))._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'transport-marchandises/regions',
      key: '99',
    })
  })
})
