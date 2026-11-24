import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  fertilisationAzoteeRequestSchema,
  type FertilisationAzoteeRequest,
} from './fertilisation-azotee-request.ts'

type Level = ComputedLevels<'fertilisation_azotee'>

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

function toRequest({ level, code }: { level: Level; code: string }): FertilisationAzoteeRequest {
  const parsed = fertilisationAzoteeRequestSchema.parse({
    id: 'fertilisation_azotee',
    territory: { level, code },
    parameters: { nitrogenReductionFraction: '0.1' },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string }) {
  return estimate(toRequest(target), context)
}

describe('estimate fertilisation_azotee, UNIFA', () => {
  it.each([
    ['region', '84', '46511.85'],
    ['region', '53', '65301.21'],
    ['region', '11', '42648.97'],
    ['region', '94', '94.32'],
    ['departement', '28', '48595.76'],
    ['departement', '75', '12511.93'],
    ['departement', '35', '18390.36'],
    ['epci', '200000172', '27.78'],
    ['epci', '200046977', '232.61'],
    ['epci', '243500139', '1543.76'],
    ['epci', '200006682', '849.87'],
  ] as const)(
    'à 10 %% de réduction, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code })._unsafeUnwrap().reduction.toFixed()).toBe(expected)
    },
  )

  it.each([
    ['departement', '2A'],
    ['departement', '2B'],
  ] as const)('refuse le département %s, la Corse n’est pas publiée par département', (level, code) => {
    expect(estimation({ level, code })._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
      dataset: 'fertilisation-azotee/departements',
    })
  })

  it('refuse l’EPCI 200054781 : sa surface bio dans le département 91 est sous secret statistique', () => {
    expect(estimation({ level: 'epci', code: '200054781' })._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'fertilisation-azotee/organic-epci-departements',
      key: '200054781-91',
    })
  })
})
