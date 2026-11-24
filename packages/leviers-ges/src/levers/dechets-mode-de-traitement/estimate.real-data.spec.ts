import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  dechetsModeDeTraitementRequestSchema,
  type DechetsModeDeTraitementRequest,
} from './dechets-mode-de-traitement-request.ts'

type Level = ComputedLevels<'dechets_mode_de_traitement'>

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const SHIFTS = {
  storageToIncinerationFraction: '0.3',
  storageToMaterialRecoveryFraction: '0.1',
  incinerationToMaterialRecoveryFraction: '0.05',
}

function toRequest({ level, code }: { level: Level; code: string }): DechetsModeDeTraitementRequest {
  const parsed = dechetsModeDeTraitementRequestSchema.parse({
    id: 'dechets_mode_de_traitement',
    territory: { level, code },
    parameters: SHIFTS,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string }) {
  return estimate(toRequest(target), context)._unsafeUnwrap()
}

describe('estimate dechets_mode_de_traitement, IREP 2022 et FE_déchets', () => {
  it.each([
    ['region', '84', '60211.95'],
    ['region', '53', '15138.26'],
    ['region', '11', '108274.73'],
    ['region', '94', '3594.68'],
    ['departement', '69', '8758.1'],
    ['departement', '75', '0'],
    ['departement', '2A', '443.94'],
    ['epci', '200046977', '7222'],
    ['epci', '200000438', '0'],
  ] as const)(
    'à 30 %%, 10 %% et 5 %% de déchets déplacés, le niveau %s %s évite %s tCO2e',
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
