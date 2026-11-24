import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  residentielChangementSystemeChauffageRequestSchema,
  type ResidentielChangementSystemeChauffageRequest,
} from './residentiel-changement-systeme-chauffage-request.ts'

type Level = ComputedLevels<'residentiel_changement_systeme_chauffage'>

const dataSource = createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data'))
const context = createEstimationContext(dataSource)

const regions = dataSource.rows('residentiel-sobriete/regions')._unsafeUnwrap()
const departements = dataSource.rows('residentiel-sobriete/departements')._unsafeUnwrap()
const epcis = dataSource.rows('residentiel-sobriete/epcis')._unsafeUnwrap()

const TARGET = {
  targetElectricityShareFraction: '0.5',
  targetNaturalGasShareFraction: '0.1',
  targetFuelOilShareFraction: '0',
  targetWoodShareFraction: '0.1',
  targetHeatNetworkShareFraction: '0.3',
}

function toRequest({ level, code }: { level: Level; code: string }): ResidentielChangementSystemeChauffageRequest {
  const parsed = residentielChangementSystemeChauffageRequestSchema.parse({
    id: 'residentiel_changement_systeme_chauffage',
    territory: { level, code },
    parameters: TARGET,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function reduction(target: { level: Level; code: string }): string {
  return estimate(toRequest(target), context)._unsafeUnwrap().reduction.toFixed()
}

describe('estimate residentiel_changement_systeme_chauffage, parts nationales SDES 2024 et rendements ADEME', () => {
  it.each([
    ['region', '84', '2534886.5'],
    ['region', '53', '787896.15'],
    ['region', '11', '3520993.89'],
    ['departement', '01', '189176.33'],
    ['departement', '35', '244191.78'],
    ['departement', '75', '602377.64'],
    ['departement', '69', '649587.99'],
    ['departement', '2A', '-230.31'],
    ['epci', '200000172', '11911.69'],
    ['epci', '200000438', '8326.74'],
  ] as const)(
    'à une cible de 50 %% d’électricité, 10 %% de gaz, 10 %% de bois et 30 %% de réseau, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(reduction({ level, code })).toBe(expected)
    },
  )

  it.each([
    ['sans part précisée, le mix actuel', {}, '67236.55'],
    ['le fioul à 0', { targetFuelOilShareFraction: '0' }, '112606.37'],
    ['le fioul à 0 et le bois à 10 %', { targetFuelOilShareFraction: '0', targetWoodShareFraction: '0.1' }, '148503.72'],
  ])('Ille-et-Vilaine, %s : %s tCO2e', (_label, parameters, expected) => {
    const parsed = residentielChangementSystemeChauffageRequestSchema.parse({
      id: 'residentiel_changement_systeme_chauffage',
      territory: { level: 'departement', code: '35' },
      parameters,
    })
    const request = { ...parsed, territory: { ...parsed.territory, level: 'departement' as const } }
    expect(estimate(request, context)._unsafeUnwrap().reduction.toFixed()).toBe(expected)
  })

  it('les 13 régions évitent 19 155 808,29 tCO2e', () => {
    const reductions = regions.map((row) =>
      reduction({ level: 'region', code: row['code_region'] ?? '' }),
    )
    expect(reductions).toHaveLength(13)
    expect(sum(reductions.map((value) => toBig(value))).toFixed()).toBe('19155808.29')
  })

  it('les 96 départements évitent 19 450 737,66 tCO2e', () => {
    const reductions = departements.map((row) =>
      reduction({ level: 'departement', code: row['code_departement'] ?? '' }),
    )
    expect(reductions).toHaveLength(96)
    expect(sum(reductions.map((value) => toBig(value))).toFixed()).toBe('19450737.66')
  })

  it('1 232 des 1 255 EPCI évitent 20 774 364,19 tCO2e, les 23 EPCI d’outre-mer sans parc de logements sont refusés', () => {
    const outcomes = epcis.map((row) =>
      estimate(toRequest({ level: 'epci', code: row['code_epci'] ?? '' }), context),
    )
    const computed = outcomes.flatMap((outcome) => (outcome.isOk() ? [outcome.value.reduction] : []))
    const refused = outcomes.flatMap((outcome) => (outcome.isErr() ? [outcome.error] : []))
    expect(computed).toHaveLength(1232)
    expect(sum(computed).toFixed()).toBe('20774364.19')
    expect(refused).toHaveLength(23)
    expect(refused.every((error) => error.kind === 'missing_data')).toBe(true)
  })
})
