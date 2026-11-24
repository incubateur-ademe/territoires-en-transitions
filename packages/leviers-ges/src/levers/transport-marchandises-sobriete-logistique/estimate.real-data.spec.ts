import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  transportMarchandisesSobrieteLogistiqueRequestSchema,
  type TransportMarchandisesSobrieteLogistiqueRequest,
} from './transport-marchandises-sobriete-logistique-request.ts'

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

function toRequest(code: string): TransportMarchandisesSobrieteLogistiqueRequest {
  const parsed = transportMarchandisesSobrieteLogistiqueRequestSchema.parse({
    id: 'transport_marchandises_sobriete_logistique',
    territory: { level: 'region', code },
    parameters: { roadFreightReductionFraction: '0.1' },
  })
  return { ...parsed, territory: { ...parsed.territory, level: 'region' } }
}

describe('estimate transport_marchandises_sobriete_logistique, SDES 2024 et OMINEA 2024', () => {
  it.each([
    ['84', '329473.45'],
    ['53', '140566.92'],
    ['11', '219653.81'],
    ['94', '2456.58'],
    ['32', '310503.13'],
    ['27', '146053.14'],
  ])('à 10 %% de réduction, la région %s évite %s tCO2e', (code, expected) => {
    expect(estimate(toRequest(code), context)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('refuse l’outre-mer, absent des données', () => {
    expect(estimate(toRequest('01'), context)._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
    })
  })
})
