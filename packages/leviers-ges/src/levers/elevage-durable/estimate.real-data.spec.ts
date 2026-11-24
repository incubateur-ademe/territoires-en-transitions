import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  elevageDurableRequestSchema,
  type ElevageDurableRequest,
} from './elevage-durable-request.ts'

type Level = ComputedLevels<'elevage_durable'>

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const ANIMALS = {
  dairyCows: {
    headcountReductionFraction: '0.1',
    entericEmissionReductionFraction: '0.05',
    targetManureShares: { liquid: '0.3', solid: '0.1', pasture: '0.5', anaerobicDigestion: '0.1' },
  },
  otherCattle: {
    headcountReductionFraction: '0.1',
    targetManureShares: { liquid: '0.2', solid: '0.3', pasture: '0.5', anaerobicDigestion: '0' },
  },
  sheep: {
    headcountReductionFraction: '0',
    entericEmissionReductionFraction: '0.1',
    targetManureShares: { liquid: '0', solid: '0.2', pasture: '0.8', anaerobicDigestion: '0' },
  },
}

function toRequest({ level, code }: { level: Level; code: string }): ElevageDurableRequest {
  const parsed = elevageDurableRequestSchema.parse({
    id: 'elevage_durable',
    territory: { level, code },
    parameters: { animals: ANIMALS },
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string }) {
  return estimate(toRequest(target), context)
}

describe('estimate elevage_durable, recensement agricole 2020 et OMINEA 2013', () => {
  it.each([
    ['region', '84', '857784.2'],
    ['region', '53', '912982.46'],
    ['region', '11', '9105.67'],
    ['region', '94', '16129.22'],
    ['departement', '69', '41327.89'],
    ['departement', '2A', '5233.5'],
    ['departement', '35', '300567.63'],
    ['departement', '91', '269.82'],
  ] as const)(
    'pour vaches laitières, autres bovins et ovins, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code })._unsafeUnwrap().reduction.toFixed()).toBe(expected)
    },
  )

  it('refuse Paris, absent du recensement agricole', () => {
    expect(estimation({ level: 'departement', code: '75' })._unsafeUnwrapErr()).toEqual({
      kind: 'missing_data',
      dataset: 'elevage-durable/departements',
      key: '75',
    })
  })

  it('refuse l’outre-mer, absent des données', () => {
    expect(estimation({ level: 'region', code: '01' })._unsafeUnwrapErr()).toMatchObject({
      kind: 'missing_data',
    })
  })
})
