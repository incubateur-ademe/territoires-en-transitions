import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  transportPersonnesReportModalRequestSchema,
  type TransportPersonnesReportModalRequest,
} from './transport-personnes-report-modal-request.ts'

type Level = ComputedLevels<'transport_personnes_report_modal'>

type Parameters = {
  readonly carToPublicTransportFraction: string
  readonly carToActiveModesFraction: string
  readonly publicTransportToActiveModesFraction: string
  readonly railShareFraction?: string
}

const context = createEstimationContext(
  createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data')),
)

const MIXED_SHIFT: Parameters = {
  carToPublicTransportFraction: '0.1',
  carToActiveModesFraction: '0.05',
  publicTransportToActiveModesFraction: '0',
}

function toRequest({
  level,
  code,
  parameters,
}: {
  level: Level
  code: string
  parameters: Parameters
}): TransportPersonnesReportModalRequest {
  const parsed = transportPersonnesReportModalRequestSchema.parse({
    id: 'transport_personnes_report_modal',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function estimation(target: { level: Level; code: string; parameters: Parameters }) {
  return estimate(toRequest(target), context)._unsafeUnwrap()
}

describe('estimate transport_personnes_report_modal, Insee-SDES 2022 et parc SDES 2025', () => {
  it.each([
    ['region', '84', '160112.86'],
    ['region', '53', '76633.85'],
    ['region', '11', '192241.31'],
    ['region', '94', '3596.96'],
    ['departement', '69', '31540.35'],
    ['departement', '75', '15358.91'],
    ['departement', '2A', '1684.01'],
    ['epci', '200046977', '20926.73'],
  ] as const)(
    'à 10 %% vers les transports en commun et 5 %% vers les modes actifs, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(estimation({ level, code, parameters: MIXED_SHIFT }).reduction.toFixed()).toBe(expected)
    },
  )

  it('avec 60 % de ferré saisi, la région 84 évite 191 896,56 tCO2e', () => {
    const parameters = { ...MIXED_SHIFT, railShareFraction: '0.6' }
    expect(estimation({ level: 'region', code: '84', parameters }).reduction.toFixed()).toBe(
      '191896.56',
    )
  })

  it.each([
    ['84', '180824.85'],
    ['11', '254048.11'],
  ])(
    'avec 20 %% des passagers.km de transport en commun reportés vers les modes actifs en plus, la région %s évite %s tCO2e',
    (code, expected) => {
      const parameters = { ...MIXED_SHIFT, publicTransportToActiveModesFraction: '0.2' }
      expect(estimation({ level: 'region', code, parameters }).reduction.toFixed()).toBe(expected)
    },
  )

  it('la Corse prend le facteur du train de Corse, la Bretagne celui du TER', () => {
    const railFactorOf = (code: string) =>
      estimation({ level: 'region', code, parameters: MIXED_SHIFT }).appliedAssumptions[
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
    const request = toRequest({ level, code, parameters: MIXED_SHIFT })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
