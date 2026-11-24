import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  transportPersonnesSobrieteDeplacementsRequestSchema,
  type TransportPersonnesSobrieteDeplacementsRequest,
} from './transport-personnes-sobriete-deplacements-request.ts'

type Level = ComputedLevels<'transport_personnes_sobriete_deplacements'>

type Parameters = {
  readonly commutingDistanceReductionFraction: string
  readonly railShareFraction?: string
}

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const TENTH_LESS: Parameters = { commutingDistanceReductionFraction: '0.1' }

function toRequest({
  level,
  code,
  parameters,
}: {
  level: Level
  code: string
  parameters: Parameters
}): TransportPersonnesSobrieteDeplacementsRequest {
  const parsed = transportPersonnesSobrieteDeplacementsRequestSchema.parse({
    id: 'transport_personnes_sobriete_deplacements',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string; parameters: Parameters }) {
  return estimate(toRequest(target), context)._unsafeUnwrap()
}

describe('estimate transport_personnes_sobriete_deplacements, Insee-SDES 2022 et parc SDES 2025', () => {
  it.each([
    ['region', '84', '176477.68'],
    ['region', '53', '82058.93'],
    ['region', '11', '181557.2'],
    ['region', '94', '6172.87'],
    ['departement', '69', '37300.37'],
    ['departement', '75', '21505.93'],
    ['departement', '2A', '2803'],
    ['epci', '200046977', '25618.38'],
  ] as const)(
    'à 10 %% de distance en moins, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code, parameters: TENTH_LESS }).reduction.toFixed()).toBe(expected)
    },
  )

  it('avec 60 % de ferré saisi, la région 84 évite 172 782,24 tCO2e', () => {
    const parameters = { ...TENTH_LESS, railShareFraction: '0.6' }
    expect(estimation({ level: 'region', code: '84', parameters }).reduction.toFixed()).toBe(
      '172782.24',
    )
  })

  it('la Corse prend le facteur du train de Corse, la Bretagne celui du TER', () => {
    const railFactorOf = (code: string) =>
      estimation({ level: 'region', code, parameters: TENTH_LESS }).appliedAssumptions[
        'railEmissionFactor'
      ]?.value
    expect({ corse: railFactorOf('94'), bretagne: railFactorOf('53') }).toEqual({
      corse: '0.187',
      bretagne: '0.0154346',
    })
  })

  it.each([
    ['region', '01'],
    ['departement', '971'],
  ] as const)('refuse %s %s, outre-mer absent des données', (level, code) => {
    const request = toRequest({ level, code, parameters: TENTH_LESS })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
