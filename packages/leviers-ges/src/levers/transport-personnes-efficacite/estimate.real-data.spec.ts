import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  transportPersonnesEfficaciteRequestSchema,
  type TransportPersonnesEfficaciteRequest,
} from './transport-personnes-efficacite-request.ts'

type Level = ComputedLevels<'transport_personnes_efficacite'>

type Parameters = {
  readonly carEcodrivingApplicationFraction: string
  readonly busEcodrivingApplicationFraction: string
  readonly carPassengerIncrease: string
  readonly busPassengerIncrease: string
}

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const FULL_ECODRIVING: Parameters = {
  carEcodrivingApplicationFraction: '1',
  busEcodrivingApplicationFraction: '1',
  carPassengerIncrease: '0',
  busPassengerIncrease: '0',
}

function toRequest({
  level,
  code,
  parameters,
}: {
  level: Level
  code: string
  parameters: Parameters
}): TransportPersonnesEfficaciteRequest {
  const parsed = transportPersonnesEfficaciteRequestSchema.parse({
    id: 'transport_personnes_efficacite',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string; parameters: Parameters }) {
  return estimate(toRequest(target), context)._unsafeUnwrap()
}

describe('estimate transport_personnes_efficacite, Insee-SDES 2022 et parc SDES 2025', () => {
  it.each([
    ['region', '84', '175864.6'],
    ['region', '53', '81921.01'],
    ['region', '11', '166551.32'],
    ['region', '94', '6134.91'],
    ['departement', '69', '37017.5'],
    ['departement', '75', '16793.87'],
    ['departement', '2A', '2789.07'],
    ['epci', '200046977', '25367.61'],
  ] as const)(
    'à 100 %% d’écoconduite, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code, parameters: FULL_ECODRIVING }).reduction.toFixed()).toBe(expected)
    },
  )

  it('à 50 % d’écoconduite et 10 % de passagers en plus, la région 84 évite 239 815,36 tCO2e', () => {
    const parameters = {
      carEcodrivingApplicationFraction: '0.5',
      busEcodrivingApplicationFraction: '0.5',
      carPassengerIncrease: '0.1',
      busPassengerIncrease: '0.1',
    }
    expect(estimation({ level: 'region', code: '84', parameters }).reduction.toFixed()).toBe(
      '239815.36',
    )
  })

  it('l’Île-de-France prend 82 % de ferré par défaut, la Bretagne 24 %', () => {
    const railShareOf = (code: string) =>
      estimation({ level: 'region', code, parameters: FULL_ECODRIVING }).appliedAssumptions['railShare']
        ?.value
    expect({ iledefrance: railShareOf('11'), bretagne: railShareOf('53') }).toEqual({
      iledefrance: '0.82',
      bretagne: '0.24',
    })
  })

  it.each([
    ['region', '01'],
    ['departement', '971'],
  ] as const)('refuse %s %s, outre-mer absent des données', (level, code) => {
    const request = toRequest({ level, code, parameters: FULL_ECODRIVING })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
