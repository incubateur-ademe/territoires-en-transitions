import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  dechetsSobrieteRequestSchema,
  type DechetsSobrieteRequest,
} from './dechets-sobriete-request.ts'

type Level = ComputedLevels<'dechets_sobriete'>

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const REDUCTIONS = {
  storageReductionFraction: '0.1',
  incinerationReductionFraction: '0.2',
}

function toRequest({ level, code }: { level: Level; code: string }): DechetsSobrieteRequest {
  const parsed = dechetsSobrieteRequestSchema.parse({
    id: 'dechets_sobriete',
    territory: { level, code },
    parameters: REDUCTIONS,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string }) {
  return estimate(toRequest(target), context)._unsafeUnwrap()
}

describe('estimate dechets_sobriete, IREP 2022 et FE_déchets', () => {
  it.each([
    ['region', '84', '138053.55'],
    ['region', '53', '38981.49'],
    ['region', '11', '291668.25'],
    ['region', '94', '2815.61'],
    ['departement', '69', '35032.39'],
    ['departement', '75', '0'],
    ['departement', '2A', '347.73'],
    ['epci', '200046977', '28888'],
    ['epci', '200000438', '0'],
  ] as const)(
    'à 10 %% du stockage et 20 %% de l’incinération réduits, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code }).reduction.toFixed()).toBe(expected)
    },
  )

  it.each([
    ['region', '84', '51700.6'],
    ['region', '11', '2527010.76'],
  ] as const)('le niveau %s %s ignore %s t sans facteur', (level, code, expected) => {
    expect(
      estimation({ level, code }).appliedAssumptions['wasteTonnesWithoutEmissionFactor']?.value,
    ).toBe(expected)
  })

  it('ne renvoie pas de tonnes sans facteur pour la Corse', () => {
    expect(
      estimation({ level: 'region', code: '94' }).appliedAssumptions[
        'wasteTonnesWithoutEmissionFactor'
      ],
    ).toBeUndefined()
  })
})
