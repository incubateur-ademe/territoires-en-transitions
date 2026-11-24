import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createEstimationContext } from '../../application/estimate/create-estimation-context.ts'
import { sum, toBig } from '../../domain/big-number.ts'
import type { ComputedLevels } from '../../domain/lever-registry.ts'
import { createCsvDataSource } from '../../infrastructure/csv/csv-data-source.ts'
import { estimate } from './estimate.ts'
import {
  residentielSobrieteRequestSchema,
  type ResidentielSobrieteRequest,
} from './residentiel-sobriete-request.ts'

type Level = ComputedLevels<'residentiel_sobriete'>

type Parameters = {
  readonly householdsApplyingSobrietyFraction: string
  readonly consumptionReductionFraction: string
}

const dataSource = createCsvDataSource(join(import.meta.dirname, '..', '..', '..', 'data'))
const context = createEstimationContext(dataSource)

const regions = dataSource.rows('residentiel-sobriete/regions')._unsafeUnwrap()
const departements = dataSource.rows('residentiel-sobriete/departements')._unsafeUnwrap()
const epcis = dataSource.rows('residentiel-sobriete/epcis')._unsafeUnwrap()

const FULL: Parameters = {
  householdsApplyingSobrietyFraction: '1',
  consumptionReductionFraction: '1',
}

const HALF_OF_HOUSEHOLDS_TEN_PERCENT_LESS: Parameters = {
  householdsApplyingSobrietyFraction: '0.5',
  consumptionReductionFraction: '0.1',
}

function toRequest({
  level,
  code,
  parameters,
}: {
  level: Level
  code: string
  parameters: Parameters
}): ResidentielSobrieteRequest {
  const parsed = residentielSobrieteRequestSchema.parse({
    id: 'residentiel_sobriete',
    territory: { level, code },
    parameters,
  })
  return { ...parsed, territory: { ...parsed.territory, level } }
}

function reduction(target: { level: Level; code: string; parameters: Parameters }): string {
  return estimate(toRequest(target), context)._unsafeUnwrap().reduction.toFixed()
}

describe('estimate residentiel_sobriete, énergie SDES 2024, CEREN 2024 et réseaux de chaleur SDES 2024', () => {
  it.each([
    ['region', '84', '4686750.91'],
    ['region', '53', '1741315.05'],
    ['region', '11', '6964521.96'],
    ['region', '94', '52254.52'],
    ['departement', '01', '349174.98'],
    ['departement', '35', '564332.91'],
    ['departement', '75', '1283555.75'],
    ['departement', '69', '1147014.9'],
    ['departement', '2A', '19931'],
    ['departement', '48', '69692.26'],
  ] as const)(
    'à 100 %% des foyers et 100 %% de baisse, le niveau %s %s évite %s tCO2e',
    (level, code, expected) => {
      expect(reduction({ level, code, parameters: FULL })).toBe(expected)
    },
  )

  it.each([
    ['region', '84', '234337.55'],
    ['departement', '35', '28216.65'],
  ] as const)(
    'à 50 %% des foyers et 10 %% de baisse, le niveau %s %s évite 5 %% du maximum : %s tCO2e',
    (level, code, expected) => {
      expect(reduction({ level, code, parameters: HALF_OF_HOUSEHOLDS_TEN_PERCENT_LESS })).toBe(expected)
    },
  )

  it('la Corse-du-Sud n’a ni gaz ni réseau de chaleur : seuls l’électricité, le fioul et le GPL comptent', () => {
    expect(reduction({ level: 'departement', code: '2A', parameters: FULL })).toBe('19931')
  })

  it('les 13 régions de métropole évitent 36 785 947,91 tCO2e à 100 %', () => {
    const regionalReductions = regions.map((row) =>
      toBig(reduction({ level: 'region', code: row['code_region'] ?? '', parameters: FULL })),
    )
    expect(regions).toHaveLength(13)
    expect(sum(regionalReductions).toFixed()).toBe('36785947.91')
  })

  it('les 96 départements de métropole évitent 37 133 226,16 tCO2e à 100 %, 0,9 % de plus que les régions', () => {
    const departmentalReductions = departements.map((row) =>
      toBig(reduction({ level: 'departement', code: row['code_departement'] ?? '', parameters: FULL })),
    )
    expect(departements).toHaveLength(96)
    expect(sum(departmentalReductions).toFixed()).toBe('37133226.16')
  })

  it('1 232 des 1 255 EPCI évitent 37 138 667,36 tCO2e à 100 % (somme des valeurs arrondies), les 23 EPCI d’outre-mer sans parc de logements sont refusés', () => {
    const outcomes = epcis.map((row) =>
      estimate(toRequest({ level: 'epci', code: row['code_epci'] ?? '', parameters: FULL }), context),
    )
    const computed = outcomes.flatMap((outcome) => (outcome.isOk() ? [outcome.value.reduction] : []))
    const refused = outcomes.flatMap((outcome) => (outcome.isErr() ? [outcome.error] : []))
    expect(epcis).toHaveLength(1255)
    expect(computed).toHaveLength(1232)
    expect(sum(computed).toFixed()).toBe('37138667.36')
    expect(refused).toHaveLength(23)
    expect(
      refused.every(
        (error) =>
          error.kind === 'missing_data' &&
          error.dataset === 'residentiel-logements/logements-epci-departement',
      ),
    ).toBe(true)
  })

  it.each([
    ['region', '01'],
    ['departement', '971'],
  ] as const)('refuse %s %s, outre-mer absent des données énergétiques', (level, code) => {
    const request = toRequest({ level, code, parameters: FULL })
    expect(estimate(request, context)._unsafeUnwrapErr()).toMatchObject({ kind: 'missing_data' })
  })
})
