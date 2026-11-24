import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  transportMarchandisesEfficaciteRequestSchema,
  type TransportMarchandisesEfficaciteRequest,
} from './transport-marchandises-efficacite-request.ts'

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

function toRequest(code: string): TransportMarchandisesEfficaciteRequest {
  const parsed = transportMarchandisesEfficaciteRequestSchema.parse({
    id: 'transport_marchandises_efficacite',
    territory: { level: 'region', code },
    parameters: { ecodrivingApplicationFraction: '0.5', loadFactorIncrease: '0.2' },
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'region' } }
}

describe('estimate transport_marchandises_efficacite, SDES 2024 et OMINEA 2024', () => {
  it.each([
    ['84', '686403.03'],
    ['53', '292847.76'],
    ['11', '457612.11'],
    ['94', '5117.88'],
    ['32', '646881.53'],
  ])(
    'à 50 %% d’écoconduite et 20 %% de chargement en plus, la région %s évite %s tCO2e',
    (code, expected) => {
      expect(estimate(toRequest(code), context)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
    },
  )

  it('refuse l’outre-mer, absent des données', () => {
    expect(estimate(toRequest('01'), context)._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
    })
  })
})
