import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  transportPersonnesElectrificationRequestSchema,
  type TransportPersonnesElectrificationRequest,
} from './transport-personnes-electrification-request.ts'

type Level = ComputedLevels<'transport_personnes_electrification'>

type Parameters = {
  readonly carElectrificationFraction: string
  readonly busElectrificationFraction: string
}

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const HALF_OF_FLEET: Parameters = {
  carElectrificationFraction: '0.5',
  busElectrificationFraction: '0.5',
}

const WHOLE_FLEET: Parameters = {
  carElectrificationFraction: '1',
  busElectrificationFraction: '1',
}

function toRequest({
  level,
  code,
  parameters,
}: {
  level: Level
  code: string
  parameters: Parameters
}): TransportPersonnesElectrificationRequest {
  const parsed = transportPersonnesElectrificationRequestSchema.parse({
    id: 'transport_personnes_electrification',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string; parameters: Parameters }) {
  return estimate(toRequest(target), context)._unsafeUnwrap()
}

describe('estimate transport_personnes_electrification, Insee-SDES 2022 et parc SDES 2025', () => {
  it.each([
    ['region', '84', '829754.99'],
    ['region', '53', '385388.18'],
    ['region', '11', '792057.81'],
    ['region', '94', '29258.78'],
    ['departement', '69', '175358.27'],
    ['departement', '75', '80881.99'],
    ['departement', '2A', '13186.32'],
    ['epci', '200046977', '120325.65'],
  ] as const)(
    'à 50 %% du parc électrifié, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code, parameters: HALF_OF_FLEET }).reduction.toFixed()).toBe(expected)
    },
  )

  it('plafonne le parc entier demandé à la part thermique de la région 84 : 1 610 272,35 tCO2e', () => {
    const result = estimation({ level: 'region', code: '84', parameters: WHOLE_FLEET })
    expect({
      reduction: result.reduction.toFixed(),
      cars: result.appliedAssumptions['carElectrificationFraction']?.value,
      buses: result.appliedAssumptions['busElectrificationFraction']?.value,
    }).toEqual({ reduction: '1610272.35', cars: '0.970626173013', buses: '0.965038140211' })
  })

  it('l’Île-de-France prend 82 % de ferré par défaut, la Bretagne 24 %', () => {
    const railShareOf = (code: string) =>
      estimation({ level: 'region', code, parameters: HALF_OF_FLEET }).appliedAssumptions['railShare']
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
    const request = toRequest({ level, code, parameters: HALF_OF_FLEET })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
